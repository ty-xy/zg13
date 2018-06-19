from typing import (Any, Dict, List, MutableMapping,
    Optional, Sequence, Set, Text)

from django.conf import settings

from zerver.lib.bugdown import (
    version as bugdown_version,
    url_embed_preview_enabled_for_realm
)

from zerver.lib.message import (
    MessageDict,
)

from zerver.lib.stream_topic import StreamTopicTarget
from zerver.models import  Stream,Recipient, Message, get_system_bot

from django.db import transaction, IntegrityError, connection
from zerver.lib.queue import queue_json_publish
from zerver.lib import bugdown
from zerver.tornado.event_queue import  send_event
from collections import defaultdict

from zerver.lib.actions import get_recipient_info, render_incoming_message, create_user_messages,get_service_bot_events,\
    bulk_insert_ums,send_welcome_bot_response,do_claim_attachments,get_active_presence_idle_user_ids






def do_send_table(messages_maybe_none: Sequence[Optional[MutableMapping[str, Any]]],
                     email_gateway: Optional[bool]=False) -> List[int]:
    messages = [message for message in messages_maybe_none if message is not None]
    print(1)
    print(messages)
    # Filter out zephyr mirror anomalies where the message was already sent
    already_sent_ids = []  # type: List[int]
    new_messages = []  # type: List[MutableMapping[str, Any]]
    for message in messages:
        print(2)
        print(message)
        if isinstance(message['message'], int):
            already_sent_ids.append(message['message'])
        else:
            new_messages.append(message)
    messages = new_messages

    links_for_embed = set()  # type: Set[Text]

    for message in messages:
        print(3)
        print(message)
        message['rendered_content'] = message.get('rendered_content', None)
        message['stream'] = message.get('stream', None)
        message['local_id'] = message.get('local_id', None)
        message['sender_queue_id'] = message.get('sender_queue_id', None)
        message['realm'] = message.get('realm', message['message'].sender.realm)

        mention_data = bugdown.MentionData(
            realm_id=message['realm'].id,
            content=message['message'].content,
        )
        print(4)
        message['mention_data'] = mention_data

        if message['message'].is_stream_message():
            stream_id = message['message'].recipient.type_id
            stream_topic = StreamTopicTarget(
                stream_id=stream_id,
                topic_name=message['message'].topic_name()
            )  # type: Optional[StreamTopicTarget]
        else:
            stream_topic = None

        info = get_recipient_info(
            recipient=message['message'].recipient,
            sender_id=message['message'].sender_id,
            stream_topic=stream_topic,
            possibly_mentioned_user_ids=mention_data.get_user_ids(),
        )

        message['active_user_ids'] = info['active_user_ids']
        message['push_notify_user_ids'] = info['push_notify_user_ids']
        message['stream_push_user_ids'] = info['stream_push_user_ids']
        message['um_eligible_user_ids'] = info['um_eligible_user_ids']
        message['long_term_idle_user_ids'] = info['long_term_idle_user_ids']
        message['default_bot_user_ids'] = info['default_bot_user_ids']
        message['service_bot_tuples'] = info['service_bot_tuples']

        # Render our messages.
        assert message['message'].rendered_content is None

        rendered_content = render_incoming_message(
            message['message'],
            message['message'].content,
            message['active_user_ids'],
            message['realm'],
            mention_data=message['mention_data'],
            email_gateway=email_gateway,
        )
        message['message'].rendered_content = rendered_content
        message['message'].rendered_content_version = bugdown_version
        links_for_embed |= message['message'].links_for_preview

        # Add members of the mentioned user groups into `mentions_user_ids`.
        mention_data = message['mention_data']
        for group_id in message['message'].mentions_user_group_ids:
            print(message['message'].mentions_user_group_ids)
            members = message['mention_data'].get_group_members(group_id)
            message['message'].mentions_user_ids.update(members)


        mentioned_user_ids = message['message'].mentions_user_ids
        default_bot_user_ids = message['default_bot_user_ids']
        mentioned_bot_user_ids = default_bot_user_ids & mentioned_user_ids
        message['um_eligible_user_ids'] |= mentioned_bot_user_ids

        # Update calculated fields of the message
        message['message'].update_calculated_fields()

    # Save the message receipts in the database
    user_message_flags = defaultdict(dict)  # type: Dict[int, Dict[int, List[str]]]
    with transaction.atomic():
        Message.objects.bulk_create([message['message'] for message in messages])
        ums = []  # type: List[UserMessageLite]
        for message in messages:
            print(6)
            print(messages)
            # Service bots (outgoing webhook bots and embedded bots) don't store UserMessage rows;
            # they will be processed later.
            mentioned_user_ids = message['message'].mentions_user_ids
            user_messages = create_user_messages(
                message=message['message'],
                um_eligible_user_ids=message['um_eligible_user_ids'],
                long_term_idle_user_ids=message['long_term_idle_user_ids'],
                mentioned_user_ids=mentioned_user_ids,
            )

            for um in user_messages:
                user_message_flags[message['message'].id][um.user_profile_id] = um.flags_list()

            ums.extend(user_messages)

            message['message'].service_queue_events = get_service_bot_events(
                sender=message['message'].sender,
                service_bot_tuples=message['service_bot_tuples'],
                mentioned_user_ids=mentioned_user_ids,
                active_user_ids=message['active_user_ids'],
                recipient_type=message['message'].recipient.type,
            )

        bulk_insert_ums(ums)

        # Claim attachments in message
        for message in messages:
            print(7)
            if Message.content_has_attachment(message['message'].content):
                do_claim_attachments(message['message'])

    for message in messages:

        print(8)
        wide_message_dict = MessageDict.wide_dict(message['message'])

        user_flags = user_message_flags.get(message['message'].id, {})
        sender = message['message'].sender
        message_type = wide_message_dict['type']

        presence_idle_user_ids = get_active_presence_idle_user_ids(
            realm=sender.realm,
            sender_id=sender.id,
            message_type=message_type,
            active_user_ids=message['active_user_ids'],
            user_flags=user_flags,
        )

        event = dict(
            type='message',
            message=message['message'].id,
            message_dict=wide_message_dict,
            presence_idle_user_ids=presence_idle_user_ids,
        )
        user_ids = message['active_user_ids'] | set(user_flags.keys())

        users = [
            dict(
                id=user_id,
                flags=user_flags.get(user_id, []),
                always_push_notify=(user_id in message['push_notify_user_ids']),
                stream_push_notify=(user_id in message['stream_push_user_ids']),
            )
            for user_id in user_ids
        ]

        if message['message'].is_stream_message():
            if message['stream'] is None:
                stream_id = message['message'].recipient.type_id
                message['stream'] = Stream.objects.select_related("realm").get(id=stream_id)
            assert message['stream'] is not None  # assert needed because stubs for django are missing
            if message['stream'].is_public():
                event['realm_id'] = message['stream'].realm_id
                event['stream_name'] = message['stream'].name
            if message['stream'].invite_only:
                event['invite_only'] = True
        if message['local_id'] is not None:
            event['local_id'] = message['local_id']
        if message['sender_queue_id'] is not None:
            event['sender_queue_id'] = message['sender_queue_id']
        send_event(event, users)

        if url_embed_preview_enabled_for_realm(message['message']) and links_for_embed:
            event_data = {
                'message_id': message['message'].id,
                'message_content': message['message'].content,
                'message_realm_id': message['realm'].id,
                'urls': links_for_embed}
            queue_json_publish('embed_links', event_data)

        if (settings.ENABLE_FEEDBACK and settings.FEEDBACK_BOT and
                message['message'].recipient.type == Recipient.PERSONAL):

            feedback_bot_id = get_system_bot(email=settings.FEEDBACK_BOT).id
            if feedback_bot_id in message['active_user_ids']:
                queue_json_publish(
                    'feedback_messages',
                    wide_message_dict,
                )

        if message['message'].recipient.type == Recipient.PERSONAL:
            welcome_bot_id = get_system_bot(settings.WELCOME_BOT).id
            if (welcome_bot_id in message['active_user_ids'] and
                    welcome_bot_id != message['message'].sender_id):
                send_welcome_bot_response(message)

        for queue_name, events in message['message'].service_queue_events.items():
            for event in events:
                queue_json_publish(
                    queue_name,
                    {
                        "message": wide_message_dict,
                        "trigger": event['trigger'],
                        "user_profile_id": event["user_profile_id"],
                    }
                )
    return already_sent_ids + [message['message'].id for message in messages]


