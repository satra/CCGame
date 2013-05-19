# LICENSE
    				
World rights to all products generated under this contract are available under a Creative Commons Attribution-NonCommercial (CC BY-NC) License, held jointly by the Red Cross/Red Crescent Climate Centre and Tank Think Labs, LLC.

# Disclaimer

This game was developed with support from the American Red Cross and CDKN.org. It was part of a research grant to The Red Cross/Red Crescent Climate Centre from the Climate and Development Knowledge Network (CDKN Action Lab Innovation Fund). As such, it is an output from a project funded by the UK Department for International Development (DFID) and the Netherlands Directorate-General for International Cooperation (DGIS) for the benefit of developing countries. However, the views expressed and information contained in it are not necessarily those of or endorsed by DFID, DGIS or the entities managing the delivery of the Climate and Development Knowledge Network, which can accept no responsibility or liability for such views, completeness or accuracy of the information or for any reliance placed on them. 

## Software requirements
The game is built on openly and freely available javascript software technologies and can be run on a local platform or configured to run on a remote web server. To run locally one only needs to download the game from XX.

### Frameworks used

1. deployd.js (Website: http://deployd.com/ Source: https://github.com/deployd/deployd)

2. angular.js (Website: http://angularjs.org/ Source: https://github.com/angular/angular.js)

3. node.js (Website: http://nodejs.org/ Source: https://github.com/joyent/node)

4. flot.js (Website: http://www.flotcharts.org/ Source: https://github.com/flot/flot)

### For developers

Install Deployd to your system following instructions on official site: http://deployd.com/download.html

Clone this repository into a development directory

    git clone https://github.com/satra/CCGame.git
    
Navigate to the CCGame/predictchallenge directory and run deployd

    cd CCGame/predictchallenge; dpd;
    
    
### For production use

*Steps based on a working Ubuntu 12.04 installation*
    
Install node.js via PPA (https://launchpad.net/~chris-lea/+archive/node.js/) 

    sudo add-apt-repository ppa:chris-lea/node.js
    sudo apt-get update
    sudo apt-get install nodejs npm

Install nginx

    sudo apt-get install nginx

Install deployd, numeric, and forever 

    sudo npm install -g deployd numeric forever

Start the deployd app as a service

    forever start production.js

Update nginx config (/etc/nginx/nginx.conf) to forward port 2403 to 80 
    
        server {
    
                listen       80;
                server_name  *YOURHOSTNAMEHERE*;
                root          /home/ubuntu/predict/CCGame/predictchallenge/public/;
    
                location / {
                    proxy_pass http://localhost:2403;
                    proxy_http_version 1.1;
                    proxy_set_header Upgrade $http_upgrade;
                    proxy_set_header Connection "upgrade";
                    proxy_set_header Host $host;
                }
    
                location /partials {
                    root         /home/ubuntu/predict/CCGame/predictchallenge/public;
                }
            }

Restart nginx

    sudo /etc/init.d/nginx restart
    

    



    
    
