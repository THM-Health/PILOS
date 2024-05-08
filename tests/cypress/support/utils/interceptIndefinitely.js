export function interceptIndefinitely(methode, requestMatcher, response, alias) {
  let sendResponse;
  const trigger = new Promise((resolve) => {
    sendResponse = resolve;
  });
  const intercept = cy.intercept(methode, requestMatcher, (request) => {
    return trigger.then(() => {
      request.reply(response);
    });
  });

  if(alias){
    intercept.as(alias);
  }
  return { sendResponse };
}
