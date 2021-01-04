import Service, { inject as service } from '@ember/service'
import config from "../config/environment"

const { baseURL } = config.pbApi

export default Service.extend({
  USER_KEY: 'PB_USER',
  paperToaster: service(),
  pilasBloquesAnalytics: service(),
  loading: {
    login: false,
    register: false,
  },
  connected: true,

  // SOLUTIONS
  openChallenge(challengeId) {
    this._send('POST', 'challenges', { challengeId }, false)
  },

  runProgram(challengeId, program, staticAnalysis) {
    const solutionId = uuidv4()
    const data = {
      challengeId,
      solutionId,
      program,
      staticAnalysis,
    }
    this._send('POST', 'solutions', data, false)

    return solutionId
  },

  executionFinished(solutionId, executionResult) {
    this._send('PUT', `solutions/${solutionId}`, { executionResult }, false)
  },

  // LOGIN - REGISTER
  async login(credentials) {
    return this._send('POST', 'login', credentials)
      .then(session => this._saveUser(session))
  },

  async register(data) {
    const { username, avatarURL } = data
    const profile = {
      nickName: username,
      avatarURL
    }
    return this._send('POST', 'register', { ...data, profile })
      .then(session => this._saveUser(session))
  },

  async validateUsername(username) {
    return this._send('GET', `register/check?username=${username}`)
  },

  logout() {
    return this._saveUser(null)
  },

  getUser() {
    return JSON.parse(localStorage.getItem(this.USER_KEY))
  },

  _saveUser(user) {
    localStorage.setItem(this.USER_KEY, JSON.stringify(user || null))
  },



  async _send(method, resource, body, reportError = true) {
    if (!this.connected) { return; }
    const user = this.getUser()
    if (body) { body.session = this.pilasBloquesAnalytics.buildSession(user?.nickName) }

    const url = `${baseURL}/${resource}`
    const flag = `loading.${resource}`
    const headers = { 
      'Content-Type': 'application/json',
      'Authorization': user ? `Bearer ${user.token}` : null
    }

    this.set(flag, true)
    return fetch(url, {
      method,
      body: JSON.stringify(body),
      headers
    })
      .catch(connectionErr => {
        if (reportError) this._alertServerError()
        // console.log({ connectionErr })
        throw connectionErr
      })
      .then(res => {
        if (res.status >= 400) res.text().then(message => { throw { status: res.status, message } })
        return res.json().catch(() => { /** if not body present */})
      })
      .finally(() => this.set(flag, false))
  },

  _alertServerError() {
    this.paperToaster.show("Problemas con el servidor, intentar más tarde", {
      duration: 4000,
      position: "top"
    })
  },
})
