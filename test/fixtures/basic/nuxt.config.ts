import MyModule from '../../../src/module'

export default defineNuxtConfig({
  modules: [
    MyModule,
  ],
  laravel: {
    baseUrl: 'http://laravel.test',
  },
})
