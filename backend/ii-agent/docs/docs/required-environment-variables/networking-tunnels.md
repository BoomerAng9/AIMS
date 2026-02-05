---
id: networking-tunnels
title: Networking and Tunnels
slug: /required-environment-variables/networking-tunnels
sidebar_position: 11
---

*Required configuration to expose your Tool Server to the internet*

As II-Agent use e2b as the sandbox provider, we hide our key credentials in a tool server that must be exposed to the internet to get access from the tool server

## `NGROK_AUTHTOKEN`

1. Create an ngrok account (free tier works for development) and log in.
2. Navigate to **Getting Started** → **Your Authtoken**.
3. Copy the token string (`2Hk...`) and paste it into `docker/.stack.env` as `NGROK_AUTHTOKEN`.
4. Keep the token secret; it grants access to your ngrok account limits.

## `NGROK_REGION`

- Pick the region closest to your machine or the people testing with you. Common choices: `us`, `eu`, `ap`, `au`, `sa`, `jp`, `in`.
- Check the [ngrok region list](https://ngrok.com/docs/secure-tunnels/regions/) if you need the full set.
- Update the env variable whenever you move to a different geography to keep latency low.

