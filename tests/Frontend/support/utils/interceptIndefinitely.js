export function interceptIndefinitely (methode, requestMatcher, response, alias) {
  let sendResponse;
  const trigger = new Promise((resolve) => {
    sendResponse = resolve;
  });
  // eslint-disable-next-line cypress/no-assigning-return-values
  const intercept = cy.intercept(methode, requestMatcher, (request) => {
    return trigger.then(() => {
      request.reply(response);
    });
  });

  // Set an alias for the intercepted request
  if (alias) {
    intercept.as(alias);
  }
  return { sendResponse };
}
