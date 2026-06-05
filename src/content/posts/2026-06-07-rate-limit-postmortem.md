---
title: "Rate Limit Postmortem"
description: "How setting CHAT_MAX_RPM_PER_IP to 2 broke my portfolio chat."
date: "2026-06-07"
tags: ["Infrastructure", "API Design"]
---
Three-layer rate limiting: per-IP RPM, session cap, daily budget. Original values: 2 RPM, 10 msgs/session.

With RPM=2, a follow-up within 30 seconds hits the limit. War Room analytics showed real usage: 4-6 msgs/session, 20-45s between messages. New limits: 6 RPM, 30 msgs/session, 150 daily budget.

Lesson: three numbers — burst tolerance, session depth, daily ceiling. Each solves a different problem.
