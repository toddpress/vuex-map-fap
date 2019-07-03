import Vuex from 'vuex';
import { createLocalVue, shallowMount } from '@vue/test-utils';

import { mapMultiRowFields, getField, updateField, createHelpers } from '../src';

const localVue = createLocalVue();

localVue.use(Vuex);

const { mapMultiRowFields: fooModuleMapMultiRowFields } = createHelpers({
  getterType: 'fooModule/getField',
  mutationType: 'fooModule/updateField',
});

describe(`Component initialized with multi row setup.`, () => {
  let Component;
  let store;
  let wrapper;

  beforeEach(() => {
    Component = {
      template: `
        <div>
          <div v-for="user in users">
            <input v-model="user.name">
            <input v-model="user.email">
          </div>
        </div>
      `,
      computed: {
        ...mapMultiRowFields([`users`]),
      },
    };

    store = new Vuex.Store({
      state: {
        users: [
          {
            name: `Foo`,
            email: `foo@foo.com`,
          },
          {
            name: `Bar`,
            email: `bar@bar.com`,
          },
        ],
      },
      getters: {
        getField,
      },
      mutations: {
        updateField,
      },
    });

    wrapper = shallowMount(Component, { localVue, store });
  });

  test(`It should render the component.`, () => {
    expect(wrapper.exists()).toBe(true);
  });

  test(`It should update field values when the store is updated.`, () => {
    store.state.users[0].name = `New Name`;
    store.state.users[1].email = `new@email.com`;

    expect(wrapper.find(`input`).element.value).toBe(`New Name`);
    expect(wrapper.find(`div:nth-child(2) input:nth-child(2)`).element.value).toBe(`new@email.com`);
  });

  test(`It should update the store when the field values are updated.`, () => {
    wrapper.find(`input`).element.value = `New Name`;
    wrapper.find(`input`).trigger(`input`);

    // The following line was added because otherwise the tests are failing.
    // This is a pretty dirty workaround for some problem with @vue/test-utils.
    // eslint-disable-next-line no-unused-expressions
    wrapper.find(`div:nth-child(2)`);

    wrapper.find(`div:nth-child(2) input:nth-child(2)`).element.value = `new@email.com`;
    wrapper.find(`div:nth-child(2) input:nth-child(2)`).trigger(`input`);

    expect(store.state.users[0].name).toBe(`New Name`);
    expect(store.state.users[1].email).toBe(`new@email.com`);
  });
});

describe(`Component initialized with deep nested multi row setup.`, () => {
  let Component;
  let store;
  let wrapper;

  beforeEach(() => {
    Component = {
      template: `
        <div>
          <div v-for="(user, user_index) in users">
            <div v-for="(address, address_index) in user.addresses">
              <input :class="'user-' + user_index + '-street-' + address_index" v-model="address.street">
              <input :class="'user-' + user_index + '-number-' + address_index" v-model="address.number">
            </div>
          </div>
        </div>
      `,
      computed: {
        ...fooModuleMapMultiRowFields([`usersForm.users`]),
      },
    };


    store = new Vuex.Store({
      modules: {
        fooModule: {
          namespaced: true,
          state: {
            usersForm: {

              users: [
                {
                  name: `Foo`,
                  email: `foo@foo.com`,
                  addresses: [{
                    street: `First Street`,
                    number: 42,
                  }],
                },
                {
                  name: `Bar`,
                  email: `bar@bar.com`,
                  addresses: [{
                    street: `First Street`,
                    number: 42,
                  },
                  {
                    street: `Second Street`,
                    number: 52,
                  }],
                },
              ],
            }
          },
          getters: {
            getField,
          },
          mutations: {
            updateField,
          },
        }

      },
    });

    wrapper = shallowMount(Component, { localVue, store });
  });

  test(`It should render the component.`, () => {
    expect(wrapper.exists()).toBe(true);
  });

  test(`THIS WOULDN'T WORK WITHOUT createHelpers MAPPING FN -- It should update deep field values when the store is updated.`, () => {
    store.state.fooModule.usersForm.users[0].addresses[0].street = `New Street`;
    store.state.fooModule.usersForm.users[1].addresses[0].number = 43;

    expect(wrapper.find(`.user-0-street-0`).element.value).toBe(`New Street`);
    expect(wrapper.find(`.user-1-number-0`).element.value).toBe(`43`);
  });

  test(`THIS WOULDN'T WORK WITHOUT createHelpers MAPPING FN -- It should update the store when the field values are updated. blau`, () => {
    wrapper.find(`.user-1-street-0`).element.value = `New Street`;
    wrapper.find(`.user-1-street-0`).trigger(`input`);
    wrapper.find(`.user-1-number-1`).element.value = `43`;
    wrapper.find(`.user-1-number-1`).trigger(`input`);
    expect(store.state.fooModule.usersForm.users[1].addresses[0].street).toBe(`New Street`);
    expect(store.state.fooModule.usersForm.users[1].addresses[1].number).toBe(`43`);
  });
});
