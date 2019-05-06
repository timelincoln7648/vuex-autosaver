//
// A fake API storage utility using LocalStorage
//
var storageKey = 'content'
var api = {
  load: async function () {
    // var json = window.localStorage.getItem(storageKey) || JSON.stringify('')
    var test = "test string"

    let thePromise = new Promise((resolve, reject) => {
      // We call resolve(...) when what we were doing asynchronously was successful, and reject(...) when it failed.
      // In this example, we use setTimeout(...) to simulate async code. 
      // In reality, you will probably be using something like XHR or an HTML5 API.
      setTimeout(function(){
        return resolve(test)
      }, 1000);
    });
    return thePromise
    
  },
  // We debounce "save()" so it will never be called more than once per second
  //  or less than once every three seconds (when there are changes to save)
  save: _.debounce(async function (content, callback) {
    window.localStorage.setItem(storageKey, JSON.stringify(content))
    // await setTimeout(1000)
    callback()
  }, 1000, { maxWait: 3000 })
}

//
// Autosaver plugin
//
var autosaverPlugin = function (store) {
  // Load the user's saved work
  // store.commit('UPDATE_CONTENT', api.load())
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
      commit('UPDATE_CONTENT', 'DERP DERP TEST')
      let data = await api.load()
      console.log("in load action after await api.load, data is: "+JSON.stringify(data))
      commit('UPDATE_CONTENT', JSON.stringify(data))
    },
    update ({ commit }, data) {
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
  template: '<textarea v-model="content" @keyup="registerChange"></textarea>',
  data: function () {
    return {
      content: this.$store.state.content
    }
  },
  methods: {
    registerChange: function () {
      this.$store.commit('UPDATE_CONTENT', this.content)
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