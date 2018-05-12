# e建联系列， ZG13

# Zulip overview

Zulip is a powerful, open source group chat application that combines the
immediacy of real-time chat with the productivity benefits of threaded
conversations. Zulip is used by open source projects, Fortune 500 companies,
large standards bodies, and others who need a real-time chat system that
allows users to easily process hundreds or thousands of messages a day. With
over 300 contributors merging over 500 commits a month, Zulip is also the
largest and fastest growing open source group chat project.

[![CircleCI Build Status](https://circleci.com/gh/zulip/zulip.svg?style=svg)](https://circleci.com/gh/zulip/zulip)
[![Travis Build Status](https://travis-ci.org/zulip/zulip.svg?branch=master)](https://travis-ci.org/zulip/zulip)
[![Coverage Status](https://img.shields.io/codecov/c/github/zulip/zulip.svg)](https://codecov.io/gh/zulip/zulip)
[![Mypy coverage](https://img.shields.io/badge/mypy-100%25-green.svg)][mypy-coverage]
[![docs](https://readthedocs.org/projects/zulip/badge/?version=latest)](https://zulip.readthedocs.io/en/latest/)
[![Zulip chat](https://img.shields.io/badge/zulip-join_chat-brightgreen.svg)](https://chat.zulip.org)
[![Twitter](https://img.shields.io/badge/twitter-@zulip-blue.svg?style=flat)](https://twitter.com/zulip)

[mypy-coverage]: https://blog.zulip.org/2016/10/13/static-types-in-python-oh-mypy/

## Getting started

Click on the appropriate link below. If nothing seems to apply,
join us on the
[Zulip community server](https://zulip.readthedocs.io/en/latest/contributing/chat-zulip-org.html)
and tell us what's up!

You might be interested in:

* **Contributing code**. Check out our
  [guide for new contributors](https://zulip.readthedocs.io/en/latest/overview/contributing.html)
  to get started. Zulip prides itself on maintaining a clean and
  well-tested codebase, and a stock of hundreds of
  [beginner-friendly issues][beginner-friendly].

* **Contributing non-code**.
  [Report an issue](https://zulip.readthedocs.io/en/latest/overview/contributing.html#reporting-issue),
  [translate](https://zulip.readthedocs.io/en/latest/translating/translating.html) Zulip
  into your language,
  [write](https://zulip.readthedocs.io/en/latest/overview/contributing.html#zulip-outreach)
  for the Zulip blog, or
  [give us feedback](https://zulip.readthedocs.io/en/latest/overview/contributing.html#user-feedback). We
  would love to hear from you, even if you're just trying the product out.

* **Supporting Zulip**. Advocate for your organization to use Zulip, write a
  review in the mobile app stores, or
  [upvote Zulip](https://zulip.readthedocs.io/en/latest/overview/contributing.html#zulip-outreach) on
  product comparison sites.

* **Checking Zulip out**. The best way to see Zulip in action is to drop by
  the
  [Zulip community server](https://zulip.readthedocs.io/en/latest/contributing/chat-zulip-org.html). We
  also recommend reading Zulip for
  [open source](https://zulipchat.com/for/open-source/), Zulip for
  [companies](https://zulipchat.com/for/companies/), or Zulip for
  [working groups and part time communities](https://zulipchat.com/for/working-groups-and-communities/).

* **Running a Zulip server**. Setting up a server takes just a couple of
  minutes. Zulip runs on Ubuntu 16.04 Xenial and Ubuntu 14.04 Trusty. The
  installation process is
  [documented here](https://zulip.readthedocs.io/en/1.7.1/prod.html).
  Commercial support is available; see <https://zulipchat.com/plans> for
  details.

* **Using Zulip without setting up a server**. <https://zulipchat.com> offers
  free and commercial hosting.

* **Applying for a Zulip internship**. Zulip runs internship programs with
  [Outreachy](https://www.outreachy.org/),
  [Google Summer of Code](https://developers.google.com/open-source/gsoc/),
  and the
  [MIT Externship program](https://alum.mit.edu/students/NetworkwithAlumni/ExternshipProgram). Zulip
  also participates in
  [Google Code-In](https://developers.google.com/open-source/gci/). More
  information is available
  [here](https://zulip.readthedocs.io/en/latest/overview/contributing.html#internship-programs).

You may also be interested in reading our [blog](http://blog.zulip.org/) or
following us on [twitter](https://twitter.com/zulip).
Zulip is distributed under the
[Apache 2.0](https://github.com/zulip/zulip/blob/master/LICENSE) license.

[beginner-friendly]: https://github.com/zulip/zulip/issues?q=is%3Aopen+is%3Aissue+label%3A%22good+first+issue%22

### i18.next 修改返回的语言 translation.js   fallbackLng: 'en' 改成fallbackLng: 'zh-hans',
# 请求消息接口
 Request URL: https://www.zg18.com/json/messages?anchor=912&num_before=200&num_after=200
# 登陆的接口
 https://www.zg18.com/json/users/me/presence
# 本地消息接口
Request URL: http://localhost:9991/json/messages?anchor=143&num_before=200&num_after=200&client_gravatar=true
# zerver/lib/rest.py  
   接口处理
# 汉化问题处理
  #部分主要的翻译是在locale 下的.po文件里进行就该，但是.po文件不会直接被识别。 
  #需要通过poedit软件 转化成二进制的.mo文件使用.
  #对于一般性的可以直接修改.json文件
