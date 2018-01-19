### Content webGLchat2

- customizer - character customizer
- js-dev     - javascript code
- html-dev   - html code
- resources  - public dir with resources

#### To run locally:

##### MySQL set up
- mysql < sql/create_db.sql
- mysql < sql/insert_test_data.sql
- edit user and password config/database.js

```javascript
const configMySQL = {
     host     : 'localhost',
     user     : 'root',
     password : '123456',
     database : 'webgl_chat'
 }
 ```

##### Set up

- npm install
- grunt

##### run with Heroku db
- node index.js
##### run with local db
- node index.js local
