---
title: Comparison to Greenlight
---

## Comparison Greenlight v2 and PILOS v4

We tried our best to create an fair comparison between Greenlight and PILOS. If you think we missed something, please let us know.

| Function / Property | Greenlight (v2.11.1) | PILOS (v4.x) |
| ------------------- | -------------------- | ------------ |

**General**
License | LGPL-3.0 | LGPL-2.1
Technology stack | Ruby (Ruby on Rails) | API: PHP (Laravel) Frontend SPA: Vue.js
User documentation | ✅ English | ✅ German ([Documentation](https://thm-health.github.io/PILOS-Docs/),[Source](https://github.com/THM-Health/PILOS-Docs))
Objective | Simple administration interface for the broadest possible international user spectrum, primarily education sector | Intuitive and flexible all in one administration and server management interface for various video conferences types, primarily education
**Authentication**
Authentication AD/LDAP | ✅ | ✅
Authentication SAML 2.0 | ❌ | ✅
Authentication OpenID-Connect | ✅ | ❌ Implemented, tests pending ([#336](https://github.com/THM-Health/PILOS/pull/139336))
Authentication manual user accounts | ✅ | ✅
Self-registration by users | ✅ | ❌
Creation of user accounts by administrator with password | ❌ |✅
Creation of user accounts by administrator without password with invitation email | ❌ |✅
Auto role mapping| ✅ AD, LDAP| ✅ All auth. providers
Distinction between auto added roles and manually added roles | ❌ | ✅
Brute force protection | ✅ Google ReCaptcha | ✅ Rate Limiting (No Google ReCaptcha for privacy reasons)
Reset password by yourself | ✅| ✅ Configurable
**Users**
Profile picture | ➖ Via URL to profile picture, currently deleted from source code due to security vulnerability | ✅ Integrated file storage with image cropping and compression
Multilingualism | ✅ German, English and more | ✅ German, English, French
Set language | ➖ Only for logged in users in profile settings | ✅ For all users always in menu bar
User defined time zone |❌ | ✅
User-defined room settings | | ✅ Disable echo test
List of all users |✅ | ✅
Search for users | ✅| ✅
Filter by roles | ✅| ✅
**Roles**
List of all roles | ✅| ✅
Create roles | ✅| ✅
Edit roles | ✅| ✅
Delete Roles | ✅| ✅
Permissions | ➖ Limited | ✅ ACL
Limitation of rooms | ❌ | ✅ Highest number of roles assigned to a user
**Application settings**
Page title | ❌ | ✅
Link to help page | ➖ Adjustable via .env, only in logged in state via dropdown | ✅ Always visible in menu bar
Logo | ✅ URL only | ✅ URL or file upload
Favicon | ❌ | ✅ URL or file upload
Maintenance banner | ✅ Simple text message | ✅ UI for design incl. colors, icons and links
Imprint | ✅ URL | ✅ URL
Privacy Policy | ✅ URL | ✅ URL
Theme settings | ✅ Limited | ✅ Limited
Server-wide limitation of rooms | ✅ | ✅ Overridable by roles
Automatic deletion of inactive rooms | ❌ | ✅ Customizable
Logo in BBB room | ❌ | ✅ URL or file upload
Default presentation for BBB room | ❌ | ✅ file upload, overridable in room settings
Custom CSS for BBB room | ❌ | ✅ file upload
**Statistics**
Recording of server load | ❌ | ✅
Record meeting load | ❌ | ✅
Recording attendee presence | ❌ | ✅ Must be enabled globally and additionally for each room; Each attendee must agree to recording before joining
Display of server utilization | ❌ | ✅ Live (every minute) Historical view in planning
Display of meeting load | ➖ Live, but no filtering by ongoing meetings Display: room name, owner and number of participants | ✅ Live (every minute) Display: start, room name, owner, server, number of participants, number of listeners, number of microphones, number of webcams ✅ Historically viewable for room owners as a graph (until expiry of retention period)
View attendance | ❌ | ✅ History for room owners as a table and as an Excel file for download (until expiration of retention period)
**Recording**
Recording possible | ✅ | ✅
Disable recording for rooms of users with specific roles | ✅ | ✅
Visibility of recording | ✅ Public or non-listed :warning: No restriction to participants of the room or obligation to authenticate; anyone with the link can access the recording | ✅ Can be restricted to different levels of access to the room and also toggle the visibility of each recording format
Download recording | ❌ | ✅ Room owners can download raw recording files (zip) content can be filtered globally using a regex allowlist
**Server / Load balancing**
Support of multiple servers | ❌ Only one server can be stored in the .env This can however also be a load balancer like Scalelite | ✅
Load balancing | ✅ With Scalelite | ✅ Integrated; connection to one or more Scalelites also possible
Consider different server strengths with load balancing | ❌ | ✅
Load balancing algorithm | Server with lowest number of meetings | Server with lowest virtual load
Display all servers |❌ | ✅ name, status, load (meetings, participants, videos)
Disable server and keep meetings running | ➖ Only possible via Scalelite command line | ✅
Disable server and stop all meetings | ➖ Only possible via Scalelite command line | ✅
Server status check | ❌ | ✅
Display BBB version |❌ | ✅ if enabled on bbb server
**Room types**
Different types of rooms | ❌ |✅
Different servers for each room type | ❌ | ✅ For load balancing, only servers from the pool assigned to a room via the room type are used. e.g. a pool with servers for large events, particularly confidential, etc. servers can be in none, one or more pools
Restrict use of certain room types | ❌ | ✅ Room type can only be released for certain roles
**Rooms**
Display own rooms | ✅ | ✅
Display shared rooms | ✅ However, no clear separation | ✅
Search in own/shared rooms | ❌ | ✅
Search for all rooms | ❌| ✅ Must be enabled in room settings and room type must allow it
**Room settings**
Room name |✅ |✅
Access code for participants | ✅ | ✅ Room members do not need one
Access code for moderators | ✅ | ❌ More flexible and individual control with personalized room links
Waiting room | ✅ Waiting room for all non-moderators | ✅ Waiting room configurable for all non-moderators or only for guests
Anyone may start the meeting | ✅ | ✅
All users are moderators | ✅ | ✅
Mute microphone when joining | ✅ | ✅
Welcome message | ❌ | ✅
Max. Duration | ❌ | ✅
Max. Number of participants | ❌ | ✅
Configure restrictions for participants in advance | ❌ | ✅
Allow room only for logged in users | ➖ Only server wide setting, no individual | ✅
**Presentations**
Upload presentations before meeting | ➖ Only one file | ✅ Manage multiple files, for each meeting can be set individually which files to use this time
Share presentations with participants before/after meeting | ❌ | ✅ Presentations can be made available for download via PILOS at any time. Can be activated for each file individually
**Share rooms / membership**
Share room with other users | ✅ | ✅
Set role of members | ❌ Always moderator | ✅ Participant, moderator or co-owner
Allow editing of room settings, presentations and memberships by other users | ❌ | ✅ For co-owners, e.g. in case of multiple lecturers / tutors
Become a member yourself / selfsubscribe | ❌ | ✅Can be activated in the room settings, an access code may be required. Students can thus find frequently used rooms on the start page and do not need the access code in the further course
Personalized room links | ❌ | ✅ Allows guests access to a room or possibly restricted for other guests. The participant name and role (participant/moderator) is set for each link and cannot be changed by the guest. The room links expire after a specified time or can be deleted beforehand.
Copy access data for a room | ✅ Copy link and access code separately | ✅ Finished text with link and access code
Auto. Joining at the start of the room | ✅ | ❌
Notification when starting the room | ❌ | ✅
