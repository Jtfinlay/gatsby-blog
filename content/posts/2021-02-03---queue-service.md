---
title: Building with Queue Services
date: "2021-02-03"
template: "post"
draft: false
slug: "building-with-queue"
category: "Services"
tags:
    - "WebDev"
    - "Queue"
    - "Services"
description: "One of my favourite tools in service development are Queue Services. If I'm designing logic that may run a long time or has a high chance of failure, I'll first look at queues."
---

One of my favourite tools in service development are Queue Services. If I'm designing logic that may run a long time or has a high chance of failure, I'll first look at queues.

A service queue is similar to the CS 101 [queue](https://en.wikipedia.org/wiki/Queue_(abstract_data_type)), but built to serve distributed systems. Many machines can write to the same queue, and many machines can dequeue and process them. This makes it a great tool for running asynchronous work in a distributed system.

Let's walk through scenarios that can leverage service queues.

## ⚙ Long-running process

Say we have a long-running operation that needs to be executed. Some examples might include:

- A video upload service, that requires encoding and transformations to be applied
- A complex operation, such as building code or the PCB analysis we do on [⚡Cadstrom.io](https://cadstrom.io)
- Performing extensive Machine Learning analysis

In each of these cases, the processing could take anywhere from minutes or hours. You *could* put this logic on your REST service, and force callers to wait for completion before they are returned an OK. But this is bad practice and most callers will assume a call has failed after several seconds.

Or, put the request in a queue and return to the callers saying you accepted their request. Clients can go about their day, and come back to check on the status on their own time 👌.

## 🦺 Handling disaster

Imagine we've built ourselves quite the service! We are managing many different tables each suiting its own purpose. When a user registers, we first leverage a third-party `authorization service`, then we write some information to the `users` table, and finally we update the `family` table so they can be in the right group. Great!

![Flow diagram for example scenario.](/media/2021-02-03---queue-service/flow-diagram.png)

Then, disaster strikes 💥‼. After registering with the `authorization service`, our service ran out of memory, or the machine was recycled, or some other tragic event! We never wrote to the user or family tables.

The caller doesn't receive any response. They try signing in with their credentials and the third-party service allows them to sign in. But.. they aren't in our `users` table, and we have no idea which `family` they belong to because the data was lost. Our system doesn't expect this state and we return the dreaded 500.

Queue storage can handle these failures - either by **rolling forward** (continue the operation until it succeeds) or **rolling back** (clean up data like it never happened).

At the start of the operation, we queue a message on a delay (say 30 seconds ⏰) and at the end of the operation, we remove the message. After 30 seconds, if the message is still in the queue, we assume there was a failure and compensate.

We would handle queue items by either cleaning up data like nothing happened (roll back), or using the message data to complete the operation (roll forward).

## 📏 Limited availability

This scenario is more difficult to identify, but is a case I hit when building [🐥Tweet Log](https://tweetlog.azureedge.net/).

Tweet Log finds the number of likes and tweets for a user by paginating through Twitter APIs. Twitter limits the number of API calls a client can perform in a time period, and I wanted a graceful way to handle this when there was high traffic.

I saw two options when hitting the Twitter API limit:

1. Force users to resubmit at a later time
2. Put the request in a queue, and complete it when Twitter allows more calls

I *strongly* preferred the second - if there is traffic, users return to check results instead of waiting until traffic dies down.

With a queue, when a user submits a name, the API first checks whether the results for that name are in the system. If not, it submits the name to the queue.

A serverless function dequeues the message, and will call Twitter for the data. If successful, then it writes results to storage, *woohoo* ✨! If we hit an API limit error, the function fails, which places the message in a **poison queue** 💀. 

The **poison queue** holds messages that have failed many times. It's a great setup that allows different handling for "problem messages" isolated from your main queue.

For Tweet Log, the poison queue is used to hold work items until the Twitter API limit is lifted, so that they can be retried.