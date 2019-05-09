//
// A fake API storage utility using LocalStorage
//
var storageKey = 'content'
var api = {
  load: function () {
    var json = window.localStorage.getItem(storageKey) || "test string"
    var test = "test string"

    let thePromise = new Promise((resolve, reject) => {
      setTimeout(function(){
        return resolve(json)
      }, 1000);
    });
    return thePromise
    
  },
  // We debounce "save()" so it will never be called more than once per second
  //  or less than once every three seconds (when there are changes to save)
  save: _.debounce(async function (content, callback) {
    window.localStorage.setItem(storageKey, content)
    await setTimeout(1000)
    callback()
  }, 1000, { maxWait: 3000 })
}

//
// Autosaver plugin
//
var autosaverPlugin = function (store) {
  // Load the user's saved work
  store.dispatch('load')

  // Every time the state changes, check the mutation type and save the results
  store.subscribe(function (mutation, state) {
    if (mutation.type === 'UPDATE_CONTENT') {
      store.commit('SET_SAVE_STATUS', 'Saving...')
      api.save(mutation.payload, function () {
        console.log("about to set as saved, mutation payload: "+mutation.payload)
        store.commit('SET_SAVE_STATUS', 'Saved')
      })
      return
    }
  })
}

//
// Vuex store
//
var store = new Vuex.Store({
  state: {
    content: '',
    saveStatus: 'Saved'
  },
  mutations: {
    'SET_SAVE_STATUS': function (state, newSaveStatus) {
      state.saveStatus = newSaveStatus
    },
    'UPDATE_CONTENT': function (state, newContent) {
      state.content = newContent
    }
  },
  actions: {
    async load ({ commit }) {
      console.log("in load action")
      commit('UPDATE_CONTENT', 'Loading...')
      let data = await api.load()
      console.log("in load action after await api.load, data is: "+data)
      commit('UPDATE_CONTENT', data)
    }
  },
  plugins: [autosaverPlugin]
})

//
// "Saving" indicator
//
Vue.component('saving-indicator', {
  template: '<div>{{ saveStatus }}</div>',
  computed: {
    saveStatus: function () {
      return this.$store.state.saveStatus
    }
  }
})

//
// Text entry box
//
Vue.component('text-entry', {
  template: '<textarea v-model="content"></textarea>',
  computed: {
    content: {
      get() {
        return this.$store.state.content
      },
      set(value) {
        this.$store.commit('UPDATE_CONTENT', value)
      }
    }
  }
})

//
// Bootstrap Vue app
//
var app = new Vue({
  el: '#app',
  template: '<div> <saving-indicator></saving-indicator> <text-entry></text-entry> </div>',
  store: store
})