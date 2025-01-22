---
title: Workflow
---

If you have a question, found a bug, or a feature is missing please report this by creating an issue in this repository.
In case when you have a solution for the feature or bug you can fork this repository and implement the solution in a
corresponding branch, since we are working by the [GitHub flow](https://guides.github.com/introduction/flow/). If
everything is ok, after a review your implementation will be merged in the main branch of the repository.

## Report a bug

Before reporting a new issue, please checkout the existing open and already **closed** issues. May be there is already a
solution for your question. If there is no appropriate issue, you can open a new one. If it is only a question you may
open an empty formless issue. In case of a feature request, or a bug report you must use the corresponding template.
Please fill out everything you can so that other can understand your problem and implement a solution or give an answer
as fast as possible without any additional discussions.

## Implementation

In case if you have a solution for a bug, or you want to implement a new feature please fork this repository, create a
new branch, implement the solution by following the [Styleguide](./05-code-style.md) and afterwards create a pull request to
this repository. Please also don't forget to update the `CHANGELOG.md` under the section `Unreleased`. After
creating a pull request fulfill the checklist in the template. Only if everything done and the PR is linked to an
existing issue, the pull request will be checked by a maintainer of this repository.

## Testing

A new development shouldn't decrease the code testing coverage. Everything in the application must be covered by
appropriate unit and feature tests, depending on the case. In case of bugfixes a test, that fails in the appropriate
case should be implemented, to make regression tests possible for further changes in the application.

Please have a look into the [Testing](./07-testing.md) documentation to learn more about the testing strategies
and how to run the tests.

## Submit changes

After implementing the new feature or bugfix you must create a new pull request to the original repository by using the
corresponding pull request template. If all checks by the ci passed and all tasks in the pull request done, a maintainer
of the repository will check the PR and may make some comments on your PR. If everything fixed or there were no problems
at all, then the PR will be merged into the main branch of this repository.
