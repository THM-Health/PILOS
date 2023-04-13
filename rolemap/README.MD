# Role mapping
For each external authenticator (LDAP, Open-ID Connect and SAML 2.0) an automatic role mapping can be configured.
The role mapping is a JSON file, which is stored in the directory `rolemap` of the pilos installation.

| Authenticator   | Filename   |
|-----------------|------------|
| LDAP            | ldap.json  |
| Open-ID Connect | oidc.json  |
| SAML 2.0        | saml2.json |

## Roles

To add a mapping to a role, add a new object to the `roles` array.
The attribute `name` must match the name of the role in pilos.

### Disable roles
To disable a role, you can add and set the attribute `disabled` to `true`.

### Rule policy
By default, only one role must be fulfilled for the role to be applied.
However, if you want to combine the rules, so that every rule must be fulfilled, set the attribute `all` to `true`.

## Rules

Each rule is defined by at least an `attribute` and `regex`.
The `attribute` is the name of an attribute of the user object retured by the external authenticator. The value of the attribute is matched with a regular expression. If the regular expression find a match the rule is fulfilled.

To create and test regular expression you can use tools like: https://regex101.com/ or https://regexr.com/ . Please note: You have to double escape the `\` symbol.

### Array attributes
If the attribute returns an array and not a string, by default the regular expression only has to match one array entry for the rule to pass.

If the regular expression has to match all array entries, add the attribute `all` to the rule object and set its value to `true`.

### Negate
To negate the result of the regex, add the attribute `not` to the rule object and set its value to `true`.

#### Arrays
The negation of arrays means: Check that regular expression doesn't match on any entry
If the `all` attribute is also true: Check that regular expression doesn't match matches all entries


## Example

The role `student` is given to each user that has an email ending with `study@uni.org`and the role `Student`.

```json
{
    "roles":[
        {
            "name":"student",
            "disabled":false,
            "all":true,
            "rules":[
                {
                    "attribute":"email",
                    "regex":"/.*(@study\\.uni\\.org)$/i",
                    "all": false,
                    "not": false
                },
                {
                    "attribute":"roles",
                    "regex":"/^(Student)$/im",
                    "all": false,
                    "not": false
                }
            ]
        }
    ]
}
```
