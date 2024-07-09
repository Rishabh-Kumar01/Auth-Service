# Welcome to Auth Service

## Project Setup

- Clone the project on your local
- Execute `npm install` on the same path as of your root directory of the
  downlaoded project
- Create a `.env` file in the root directory and add the following environment
  variable
  - `PORT=3000`
- Inside the `src/config` folder create a new file `config.json` and then add
  the following piece of json

```
{
  "development": {
    "username": "YOUR_DB_LOGIN_NAME",
    "password": "YOUR_DB_PASSWORD",
    "database": "AUTH_DB_DEV",
    "host": "127.0.0.1",
    "dialect": "mysql"
  }
}
```

- Once you've added your db config as listed above, go to the src folder from
  you terminal and execute `npx sequelize db:create`

## DB Design

- User Table
- Role Table

- A User can have multiple roles and a role can be assigned to multiple users.

## Tables

### Users -> id, email, password, createdAt, updatedAt

```
npx sequelize model:generate --name User --attributes name:String,password:String
```

### Roles -> id, name, createdAt, updatedAt

```
npx sequelize model:generate --Role City --attributes name:String
```

- To map user roles, we need to create a new User_Roles table. To achieve this,
  we synchronize the `Users` and `Roles` tables, as they have a many-to-many
  relationship using Sequelize.

### User_Roles -> RoleId, UserId , createdAt, updatedAt

```
await db.sequelize.sync({ alter: true }); // Inside the server.js file
```
