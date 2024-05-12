# Starting the server
## Run docker container using DB image
docker run -d --name mysqlserver -p 3306:3306 -e "MYSQL_RANDOM_ROOT_PASSWORD=yes" -e "MYSQL_DATABASE="tarpaulin -e "MYSQL_USER=**\<username>** -e "MYSQL_PASSWORD=**\<password>**" mysql

## Add the following fields to your .env file
<ul>
    <li>MYSQL_DATABASE</li>
    <li>MYSQL_USER</li>
    <li>MYSQL_PASSWORD`</li>
</ul>

## Run the program
`npm run dev`