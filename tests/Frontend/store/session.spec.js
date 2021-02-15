import Session from '../../../resources/js/store/modules/session';
import sinon from 'sinon';
import moxios from 'moxios';

describe('store/session', function () {
  beforeEach(function () {
    moxios.install();
  });

  afterEach(function () {
    moxios.uninstall();
  });

  it('getSettings loads the settings from the server, resolves only after the request is fulfilled and sets the corresponding property', async function () {
    const commit = sinon.spy();

    moxios.stubRequest('/api/v1/settings', {
      status: 200,
      response: { data: { foo: 'bar' } }
    });

    await Session.actions.getSettings({ commit });

    sinon.assert.calledOnce(commit);
    sinon.assert.calledWith(commit, 'setSettings', { foo: 'bar' });
  });
});
