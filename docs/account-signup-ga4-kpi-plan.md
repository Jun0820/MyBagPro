# MyBagPro account signup GA4 KPI plan

Updated: 2026-05-13

## Primary KPI

The main KPI is account creation.

In GA4, mark this event as a key event:

- `signup_success`

This event fires when Supabase accepts a new email signup. If email confirmation is required, the event includes `requires_email_confirmation: true`.

## Funnel events

Use this funnel in GA4 Explorations:

| Step | Event | Meaning |
|---|---|---|
| 1 | `open_register` | User opened a register entry point |
| 2 | `auth_modal_view` | Auth modal actually rendered |
| 3 | `begin_signup` | User submitted a valid signup form |
| 4 | `signup_success` | Signup was accepted |
| 5 | `login_success` | User successfully logged in |

Supporting events:

| Event | Meaning |
|---|---|
| `open_login` | Login entry point opened |
| `begin_login` | User submitted login form |
| `auth_mode_switch` | User switched between login and join |
| `signup_email_sent` | Confirmation email was sent |
| `signup_confirmation_resend` | Confirmation email was resent |
| `auth_validation_error` | Form validation blocked submission |
| `auth_error` | Supabase auth returned an error |

## Core dimensions

Most auth events include:

| Parameter | Meaning |
|---|---|
| `auth_mode` | `register` or `login` |
| `auth_intent` | `create-profile` or `login` |
| `next_destination` | Intended post-auth destination |
| `draft_club_count` | Number of clubs already entered before auth |
| `has_draft_ball` | Whether the user already entered a ball |
| `has_draft_head_speed` | Whether the user already entered head speed |
| `has_draft_average_score` | Whether the user already entered average score |
| `source_surface` | CTA location when available |

## First reports to build

1. Signup funnel
   - `open_register` -> `auth_modal_view` -> `begin_signup` -> `signup_success`

2. CTA source report
   - Dimension: `source_surface`
   - Metrics: `open_register`, `begin_signup`, `signup_success`

3. Draft value report
   - Dimension: `draft_club_count`
   - Metrics: `begin_signup`, `signup_success`
   - Goal: see whether users with existing bag data convert better.

4. Error report
   - Dimension: `error_type` or `error_message`
   - Metrics: `auth_validation_error`, `auth_error`

## Product hypothesis

MyBagPro should not push registration before value is clear.

The preferred account creation flow is:

1. Read article or view pro setting.
2. Start diagnosis or compare with own bag.
3. Enter some bag/diagnosis data without requiring signup.
4. Ask for account creation when saving results or continuing later.
5. After signup, send the user to My Page and prompt first club/ball registration.

The `draft_club_count` and `next_destination` parameters help validate whether this flow converts better than simple header signup.
