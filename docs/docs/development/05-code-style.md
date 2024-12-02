---
title: Code style
---

The backend uses the php framework Laravel and therefore it follows the
[Laravel coding style guide](https://laravel.com/docs/11.x/contributions#coding-style). To apply the code style to your
implemented code you can run the command `sail composer run fix-cs`.

The frontend style gets checked by prettier and the code is linted using eslint.
The style can be fixed by running the command `sail npm run prettier:fix`.
Lint fixes can a applied by running the command `sail npm run lint:fix`.
For best practices checkout the [vue style guide](https://vuejs.org/v2/style-guide/).

Additionally, to the style guides the following things should apply to the changes:

- Short and meaningful method, attribute and class names
- Short and not complex methods
- Make things dry and reuse where possible (e.g. mixins or components in the frontend)
- Errors should be handled (in the frontend at least with the `Base.error()` method)
- Permissions should be checked where necessary in frontend and backend
- Validations for requests must exist in the backend
- Translation of static language at least in English
- Don't change already committed database migrations
- Change only database seeds if they are considered, to be executed multiple times
- Define application settings where possible, instead of just hardcode things or creating environment variables
- Don't implement multiple issue solutions in one branch
- Use short and meaningful branch names with the issue number and a short description in the imperative mood
- Commit messages should also use the imperative mood and be as short as possible (checkout also [this](https://chris.beams.io/posts/git-commit/#limit-50) blogpost)
