import Index from '../../../resources/js/views/rooms/Index.vue'

describe('<Index />', () => {

  it('renders', () => { //ToDo fix or delete
    cy.mount(Index, {
      global: {
        mocks: {
          $t: (key, values) => key + (values !== undefined ? ':' + JSON.stringify(values) : '')
        }
      }
    })
  })
})
