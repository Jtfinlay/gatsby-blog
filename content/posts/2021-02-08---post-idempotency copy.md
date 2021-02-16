---
title: Idempotency with POST APIs
date: "2021-02-08"
template: "post"
draft: false
slug: "idempotency-with-post"
category: "Services"
tags:
    - "WebDev"
    - "Services"
description: "Idempotency is critical in web services. It means the same request can be repeated multiple times and get the same result. A general question to identify it is: *does data change if the same call is repeated?*"
---

Idempotency is critical in web services. It means the same request can be repeated multiple times and get the same result. A general question to identify it is: *does data change if the same call is repeated?*

✅ Looking up a customer's name or address from a system is usually idempotent, as there is no change in the system.

✅ Changing a customer's name to *XYZ* is usually idempotent because updating it multiple times to the same value has consistent results.

❌ Creating an entity with `POST` is not idempotent. We want to create a user by providing their first name. If we repeat the same call multiple times, the service will consider them to be separate requests and create multiple users.

![Illustrations of the three scenarios outlined above](/media/2021-02-08---post-idempotency/idempotent-examples.png)

This could have bad results depending on the operation. For an e-commerce site, it could mean charging for the same purchase multiple times.

## Tracking ID

An elegant solution is to have the client pass a `tracking-id` with each request and to keep it consistent between retries.

1. Client calls POST with `tracking-id`
2. Server creates a *checkpoint* storage entity from the id (after checking if in use)
3. Server performs the operation logic
4. Server updates the *checkpoint* entity with the operation response
5. Server returns the operation response

![Illustrations of the tracking id pattern](/media/2021-02-08---post-idempotency/tracking-id.png)

Say the network call returning the response is lost. The client sees a timeout and decides to retry the request.

1. Client calls POST again with the same `tracking-id`
2. Server checks whether `tracking-id` is in use and discovers the idempotent response from the first operation.
3. Server returns the idempotent response to the caller.

In this way, the unique `tracking-id` provided by the caller ensures that the operation provides idempotency 

## Call-outs

This is a generic multi-purpose design. The checkpoint logic can be built as *middleware* and used by all write operations.

However, there are a few edge cases to consider with this design.

### Client calls with same `tracking-id` while the operation is executing.

The *checkpoint entity* was created with the id, but there is no operation response available yet.

Best option is to return a `409 Conflict` and have the client try again.

### Server operation fails such that *checkpoint* is not updated with the result.

Services can fail at any time - the machine is recycled, the process runs out of memory, or the data center hits issues.

This pattern complements the use of [Service Queues to perform roll-forward or roll-back of failed operations](https://jamesfinlay.io/posts/building-with-queue).

## Thanks! 👋

Excited to hear other solutions or design others use.