migrate(
  (app) => {
    const users = app.findCollectionByNameOrId('users')
    users.createRule = null
    users.deleteRule = null
    app.save(users)
  },
  (app) => {
    const users = app.findCollectionByNameOrId('users')
    users.createRule = null
    users.deleteRule = null
    app.save(users)
  },
)
