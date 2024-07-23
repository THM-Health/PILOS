---
title: External Authentication
description: Guide how to connect PILOS to external authentication systems like LDAP and Shibboleth
---

## Introduction

PILOS has two types of users:

**Local users**
Local users can be created by administrators. They can log in to the system with the combination of email address and password. Via PILOS, an email can be sent to the user upon creation, also a password reset function can be activated.

**External users**
In large environments it is impractical to manage all users in PILOS. Therefore PILOS can be connected to external authentication systems. LDAP, Shibboleth and OpenID-Connect are available as interfaces. All three authentication providers can be operated in parallel, but none of them more than once.


## Setup of external authenticators

### LDAP

To enable LDAP, you need to add/set the following options in the  `.env` file and adjust to your needs.

```bash
# LDAP config
LDAP_ENABLED=true
LDAP_HOST=ldap.university.org
# For anonymous bind keep LDAP_USERNAME and LDAP_PASSWORD empty
LDAP_USERNAME="cn=readonly,dc=university,dc=org"
LDAP_PASSWORD="readonly"
LDAP_PORT=389
LDAP_BASE_DN="ou=users,dc=university,dc=org"
LDAP_TIMEOUT=5
LDAP_SSL=false
LDAP_TLS=true

# LDAP logging debugging only
LDAP_LOGGING=false

# Query the users attributes using the users own credentials
#LDAP_LOAD_ATTRIBUTES_AS_USER=false

# Raw LDAP filter to restrict the user search
#LDAP_FILTER=

# Attribute with GUID; OpenLDAP: 'entryuuid', AD: 'objectGUID'
LDAP_GUID_KEY=entryuuid

# Comma seperated list of the object class
LDAP_OBJECT_CLASSES=top,person,organizationalperson,inetorgperson

# Attribute by which the user should be found in the LDAP
LDAP_LOGIN_ATTRIBUTE=uid
```

#### SSL / TLS

You can either use SSL or TLS to secure the connection to the LDAP server.
SSL has been deprecated and is typically a separate port (636).
TLS is using the same port as the unsecured connection (389) and doing an upgrade to TLS after the connection has been established.
[Read more](https://ldaprecord.com/docs/core/v3/configuration/#ssl--tls).

By default, PILOS **doesn't verify** the TLS certificate of the LDAP server.
However, you can customize this by overwriting the ldap.conf ([Read more](http://www.openldap.org/software/man.cgi?query=ldap.conf&manpath=OpenLDAP+2.6-Release)
) config file in `/etc/openldap/ldap.conf` using docker volumes.

### Shibboleth

The shibboleth authentication is available if the reverse proxy is apache with mod_shib.
The application trusts the header information of the apache webserver and authenticates the user via the shibboleth protected route /auth/shibboleth/callback.

#### Configure Apache + mod_shib

You need to add the two options to your apache reverse proxy configuration to enable shibboleth support.
```apacheconf
<Location />
    AuthType shibboleth
    ShibUseHeaders On
    Require shibboleth
</Location>

<Location /auth/shibboleth/callback>
    AuthType shibboleth
    ShibUseHeaders On
    ShibRequireSession On
    Require valid-user
</Location>
```

If you host your own discovery service, you also need to add these lines before the `ProxyPass` so that these requests are not proxied.
```apacheconf
ProxyPass /shibboleth-ds !
ProxyPass /shibboleth-sp !
```


You need the add the url of the font- and back-channel to the ApplicationDefaults element in the `/etc/shibboleth/shibboleth2.xml` file:

```xml
<Notify Channel="back" Location="https://DOMAIN.TLD/auth/shibboleth/logout" />
<Notify Channel="front" Location="https://DOMAIN.TLD/auth/shibboleth/logout" />
```

#### Configure application to use shibboleth

To enable Shibboleth, you need to enable it in the  `.env` file.

```bash
# Shibboleth config
SHIBBOLETH_ENABLED=true
```

If Shibboleth authentication is enabled and a user is logged in via Shibboleth, session validity is checked on every request.
If the check fails, the user is automatically logged out.

This is a common problem when running multiple SPs behind a load balancer, as by default they don't share session information and therefore other SPs cannot validate the session.
As running a shared session between multiple SPs is a complex task, the recommended approach is not to require a valid Shibboleth session for every request ([Learn more](https://shibboleth.atlassian.net/wiki/spaces/SP3/pages/2065334324/Clustering)).

It is also the default behaviour of SPs to drop a session when the user's IP changes.
This can happen if the user changes networks (mobile -> wifi) or uses a VPN (e.g. iCloud Private Relay).
This can be mitigated either by disabling the IP check in the Shibboleth configuration ([Learn mode](https://shibboleth.atlassian.net/wiki/spaces/SP3/pages/2110390365/AddressChecking)) or by disabling the Shibboleth session check in PILOS.

To disable the shibboleth session check you can set the following `.env` variable:

```bash
# Disable checking Shibboleth session in every request
SHIBBOLETH_SESSION_CHECK_ENABLED=false
```

### OpenID Connect

To enable OpenID Connect, you need to add/set the following options in the  `.env` file and adjust to your needs.

The required `openid` scope is always present, even if not explicitly set. If you need more scopes to get all required attributes, add them as a comma separated list. The default value for `OIDC_SCOPES` is `profile,email`.

```
# OpenID Connect config
OIDC_ENABLED=true
OIDC_ISSUER=http://idp.university.org
OIDC_CLIENT_ID=my_client_id
OIDC_CLIENT_SECRET=my_client_secret
OIDC_SCOPES="profile,email"
```

In your IDP you should configure the following:

- Redirect URI: https://your-domain.com/auth/oidc/callback
- Post Logout Redirect URI: https://your-domain.com/logout
- Backchannel Logout URI: https://your-domain.com/auth/oidc/logout


## Configure mapping

For each external authenticator the attribute and role mapping needs to be configured.
The mapping is defined in a JSON file, which is stored in the directory `app/Auth/config` of the pilos installation.

| Authenticator   | Filename                |
|-----------------|-------------------------|
| LDAP            | ldap_mapping.json       |
| Shibboleth      | shibboleth_mapping.json |
| OpenID Connect | oidc_mapping.json       |

### Attribute mapping

#### Required attributes

You must add attribute mapping for the following attributes.

| Attribute     | Description                                  |
|---------------|----------------------------------------------|
| external_id   | Unique identifier of the user, e.g. username |
| first_name    | First name                                   |
| last_name     | Last name                                    |
| email         | Email                                        |


**Notice:** The external identifier (`external_id`) is used to uniquely identify a user within each authenicator.
User accounts are not shared between authenicators.

#### Array attributes

If the value of one of the **required** attributes is an array, the first array entry is used.


#### Additional attributes

You can define additional attributes.
These attributes are not saved in the database, but they can be used for role mapping.

### Role mapping
### Roles

To add a mapping to a role, add a new object to the `roles` array.
The attribute `name` must match the name of the role in pilos.

#### Disable roles
To disable a role, you can add and set the attribute `disabled` to `true`.

#### Rule policy
By default, only one role must be fulfilled for the role to be applied.
However, if you want to combine the rules, so that every rule must be fulfilled, set the attribute `all` to `true`.

### Rules

Each rule is defined by at least an `attribute` and `regex`.
The `attribute` is the name of an attribute of the user object defined in the attribute mapping. The value of the attribute is matched with a regular expression. If the regular expression find a match the rule is fulfilled.

To create and test regular expression you can use tools like: https://regex101.com/ or https://regexr.com/ . Please note: You have to double escape the `\` symbol.

#### Array attributes
If the attribute returns an array and not a string, by default the regular expression only has to match one array entry for the rule to pass.

If the regular expression has to match all array entries, add the attribute `all` to the rule object and set its value to `true`.

#### Negate
To negate the result of the regex, add the attribute `not` to the rule object and set its value to `true`.

##### Arrays
The negation of arrays means: Check that regular expression doesn't match on any entry
If the `all` attribute is also true: Check that regular expression doesn't match matches all entries


### Examples

#### LDAP

##### Attributes
In this example the LDAP schema uses the common name (CN) as username and has the group memberships in the memberof attribute.

##### Roles
- The "superuser" role is assigned to any user whose email ends with @its.university.org and who is in the "cn=admin,ou=Groups,dc=uni,dc=org" group.

- The "user" role is given to everyone.

```json
{
    "attributes": {
        "external_id": "cn",
        "first_name": "givenname",
        "last_name": "sn",
        "email": "mail",
        "groups": "memberof"
    },
    "roles":[
        {
            "name": "user",
            "disabled": false,
            "rules": [
                {
                    "attribute": "external_id",
                    "regex": "/^.*/i"
                }
            ]
        },
        {
            "name": "superuser",
            "disabled": false,
            "all": true,
            "rules": [
                {
                    "attribute":"email",
                    "regex":"/@its\\.university\\.org$/i"
                },
                {
                    "attribute": "groups",
                    "regex": "/^cn=admin,ou=Groups,dc=university,dc=org$/im"
                }
      ]
    }
    ]
}
```

#### Shibboleth

##### Attributes
The attribute names are the header names in which the attribute values are send by the apache mod_shib to the application. 

##### Roles
- The "superuser" role is assigned to any user whose email ends with @its.university.org and who has the "staff" affiliation.
- The "user" role is given to everyone.

```json
{
    "attributes": {
        "external_id": "principalname",
        "first_name": "givenname",
        "last_name": "surname",
        "email": "mail",
        "roles": "affiliation"
    },
    "roles":[
        {
            "name":"superuser",
            "disabled":false,
            "all":true,
            "rules":[
                {
                    "attribute":"email",
                    "regex":"/.*(@its\\.university\\.org)$/i"
                },
                {
                    "attribute":"roles",
                    "regex":"/^(staff)$/im"
                }
            ]
        },
        {
            "name": "user",
            "disabled": false,
            "rules": [
                {
                    "attribute": "external_id",
                    "regex": "/^.*/im"
                }
            ]
        }
    ]
}
```

####  OpenID Connect

##### Attributes
In this example the OpenID Connect provider returns the claim `preferred_username` which contains the username and an additional claim `roles` with an array of roles.

##### Roles
- The "superuser" role is assigned to any user who has the "pilos-superuser" role.

```json
{
    "attributes": {
        "external_id": "preferred_username",
        "first_name": "given_name",
        "last_name": "family_name",
        "email": "email",
        "roles": "roles"
    },
    "roles":[
        {
            "name": "superuser",
            "disabled": false,
            "rules": [
                {
                    "attribute": "roles",
                    "regex": "/^pilos-superuser$/im"
                }
            ]
        }
    ]
}
```
