# Prediction System
For CS2 &amp; Valorant (Implement in [NightBot](https://nightbot.tv)). Created for https://www.twitch.tv/sherrng

# Live API URL
https://prediction-api.kyroskoh.repl.co/

# Live Site Demo
https://www.twitch.tv/sherrng

# API Endpoints
<details>
<summary>API Endpoints</summary>

## Add your prediction
/prediction/:channel/add?username={user}&prediction=13-11

## Edit your prediction
/prediction/:channel/edit?username={user}&prediction=11-13

## List all predictions
/prediction/:channel/list

## Check on Prediction System status (Check for Close or Open)
/prediction/:channel/status

## Set result and show winners (Prediction System needs to be closed first)
/prediction/:channel/result?result=13-10

## Open a new prediction (WARN: Previous data will be cleared)
/prediction/:channel/open

## Close predictions
/prediction/:channel/close

## Force adding an user's prediction when Prediction has been closed
/prediction/:channel/addByOwner?username={otheruser}&prediction=13-9

## Force adding an user's prediction when Prediction has been closed
/prediction/:channel/addByMods?mods={modUser}&username={otherUser}&prediction=13-9

## Force adding an user's prediction when Prediction has been closed!
/prediction/:channel/addByAdmins?admins={adminUser}&username={otherUser}&prediction=13-9

## Add a Twitch Channel Prediction Admin
/prediction/:channel/admin/addAdmin?username={user}

## Remove a Twitch Channel Prediction Admin
/prediction/:channel/admin/removeAdmin?username={user}

## List all Twitch Channel Prediction Admins
/prediction/:channel/admin/list

</details>

# NightBot Commands
<details>
<summary>NightBot Commands (Add via your Twitch Chat)</summary>

## To show all the important prediction commands
```
!addcom !predictcmds -cd=5 Commands for Prediction System (created by @KyrosKoh): !opredict (mod only), !apredict xx-xx, !epredict xx-xx, !lpredict, !cpredict (mod only), !wpredict xx-xx (mod only), !fpredict username xx-xx (owner only), !spredict
```
 
## For everyone
### Add your prediction
```
!addcom !addpredict -cd=5 $(urlfetch https://prediction-api.kyroskoh.repl.co/prediction/$(channel)/add?username=$(user)&prediction=$(1))
```
```
!addcom !apredict -cd=5 $(urlfetch https://prediction-api.kyroskoh.repl.co/prediction/$(channel)/add?username=$(user)&prediction=$(1))
```
```
!addcom !ap -cd=5 $(urlfetch https://prediction-api.kyroskoh.repl.co/prediction/$(channel)/add?username=$(user)&prediction=$(1))
```
Usage: !apredict 13-11

### Edit your prediction
```
!addcom !editpredict -cd=5 $(urlfetch https://prediction-api.kyroskoh.repl.co/prediction/$(channel)/edit?
username=$(user)&prediction=$(1))
```
```
!addcom !epredict -cd=5 $(urlfetch https://prediction-api.kyroskoh.repl.co/prediction/$(channel)/edit?
username=$(user)&prediction=$(1))
```
```
!addcom !ep -cd=5 $(urlfetch https://prediction-api.kyroskoh.repl.co/prediction/$(channel)/edit?
username=$(user)&prediction=$(1))
```
Usage: !epredict 11-13

### List all predictions
```
!addcom !listpredict -cd=5 $(urlfetch https://prediction-api.kyroskoh.repl.co/prediction/$(channel)/list)
```
```
!addcom !lpredict -cd=5 $(urlfetch https://prediction-api.kyroskoh.repl.co/prediction/$(channel)/list)
```
```
!addcom !lp -cd=5 $(urlfetch https://prediction-api.kyroskoh.repl.co/prediction/$(channel)/list)
```
Usage: !lpredict

### Check on Prediction System status (Check for Close or Open)
```
!addcom !predictstatus -cd=5 $(urlfetch https://prediction-api.kyroskoh.repl.co/prediction/$(channel)/status)
```
```
!addcom !spredict -cd=5 $(urlfetch https://prediction-api.kyroskoh.repl.co/prediction/$(channel)/status)
```
```
!addcom !sp -cd=5 $(urlfetch https://prediction-api.kyroskoh.repl.co/prediction/$(channel)/status)
```
Usage: !spredict

## For Twitch Channel Owner
### Add a Twitch Channel Prediction Admin
```
!addcom !addadminpredict -cd=5 -ul=owner $(urlfetch https://prediction-api.kyroskoh.repl.co/prediction/$(channel)/admin/addAdmin?username=$(1))
```
Usage: !addadminpredict NightBot

### Remove a Twitch Channel Prediction Admin
```
!addcom !removeadminpredict -cd=5 -ul=owner $(urlfetch https://prediction-api.kyroskoh.repl.co/prediction/$(channel)/admin/removeAdmin?username=$(1))
```
```
!addcom !remadminpredict -cd=5 -ul=owner $(urlfetch https://prediction-api.kyroskoh.repl.co/prediction/$(channel)/admin/removeAdmin?username=$(1))
```
Usage: !remadminpredict NightBot

### List all Twitch Channel Prediction Admins
```
!addcom !listadminpredict -cd=5 $(urlfetch https://prediction-api.kyroskoh.repl.co/prediction/$(channel)/admin/list)
```
```
!addcom !ladminpredict $(urlfetch https://prediction-api.kyroskoh.repl.co/prediction/$(channel)/admin/list)
```
```
!addcom !lap $(urlfetch https://prediction-api.kyroskoh.repl.co/prediction/$(channel)/admin/list)
```
Usage: !ladminpredict

### Force adding an user's prediction when Prediction has been closed
```
!addcom !faddpredict -cd=5 -ul=owner $(urlfetch https://prediction-api.kyroskoh.repl.co/prediction/$(channel)/addByOwner?username=$(1)&prediction=$(2))
```
```
!addcom !fpredict -cd=5 -ul=owner $(urlfetch https://prediction-api.kyroskoh.repl.co/prediction/$(channel)/addByOwner?username=$(1)&prediction=$(2))
```
Usage: !fpredict NightBot 13-9

## For Twitch Channel Mods (Twitch Channel Owner can use too!)
### Force adding an user's prediction when Prediction has been closed
```
!addcom !fmodpredict -cd=5 -ul=mod $(urlfetch https://prediction-api.kyroskoh.repl.co/prediction/$(channel)/addByMods?mods=$(user)&username=$(1)&prediction=$(2))
```
Usage: !fmodpredict NightBot 13-9

### Open a new prediction (WARN: Previous data will be cleared)
```
!addcom !openpredict -cd=5 -ul=mod $(urlfetch https://prediction-api.kyroskoh.repl.co/prediction/$(channel)/open)
```
```
!addcom !opredict -cd=5 -ul=mod $(urlfetch https://prediction-api.kyroskoh.repl.co/prediction/$(channel)/open)
```
```
!addcom !op -cd=5 -ul=mod $(urlfetch https://prediction-api.kyroskoh.repl.co/prediction/$(channel)/open)
```
Usage: !opredict

### Close predictions
```
!addcom !closepredict -cd=5 -ul=mod $(urlfetch https://prediction-api.kyroskoh.repl.co/prediction/$(channel)/close)
```
```
!addcom !cpredict -cd=5 -ul=mod $(urlfetch https://prediction-api.kyroskoh.repl.co/prediction/$(channel)/close)
```
```
!addcom !cp -cd=5 -ul=mod $(urlfetch https://prediction-api.kyroskoh.repl.co/prediction/$(channel)/close)
```
Usage: !cpredict

### Set result and show winners (Prediction System needs to be closed first)
```
!addcom !wonpredict -cd=5 -ul=mod $(urlfetch https://prediction-api.kyroskoh.repl.co/prediction/$(channel)/result?result=$(1))
```
```
!addcom !wp -cd=5 -ul=mod $(urlfetch https://prediction-api.kyroskoh.repl.co/prediction/$(channel)/result?result=$(1))
```
```
!addcom !wpredict -cd=5 -ul=mod $(urlfetch https://prediction-api.kyroskoh.repl.co/prediction/$(channel)/result?result=$(1))
```
```
!addcom !resultpredict -cd=5 -ul=mod $(urlfetch https://prediction-api.kyroskoh.repl.co/prediction/$(channel)/result?result=$(1))
```
```
!addcom !rpredict -cd=5 -ul=mod $(urlfetch https://prediction-api.kyroskoh.repl.co/prediction/$(channel)/result?result=$(1))
```
```
!addcom !rp -cd=5 -ul=mod $(urlfetch https://prediction-api.kyroskoh.repl.co/prediction/$(channel)/result?result=$(1))
```
Usage: !wpredict 13-10

## For Assigned Twitch Channel Prediction Admins (No other access like Twitch Channel Mods)
### Force adding an user's prediction when Prediction has been closed!
```
!addcom !fadminpredict -cd=5 $(urlfetch https://prediction-api.kyroskoh.repl.co/prediction/$(channel)/addByAdmins?admins=$(user)&username=$(1)&prediction=$(2))
```
Usage: !fadminpredict NightBot 13-9

</details>

# Commands in Live Site
<details>
<summary>Commands in Live Site</summary>

## For everyone
### !addpredict / !apredict / !ap
Description: Add your prediction
Usage: !apredict 13-11

### !editpredict / !epredict / !ep
Description: Edit your prediction
Usage: !epredict 11-13

### !listpredict / !lpredict / !lp
Description: List all predictions
Usage: !lpredict

### !predictstatus / !spredict / !sp
Description: Check on Prediction System status (Check for Close or Open)
Usage: !spredict

## For Twitch Channel Owner
### !addadminpredict
Description: Add a Twitch Channel Prediction Admin
Usage: !addadminpredict NightBot

### !removeadminpredict / !remadminpredict
Description: Remove a Twitch Channel Prediction Admin
Usage: !remadminpredict NightBot

## !listadminpredict / !ladminpredict / !lap
Description: List all Twitch Channel Prediction Admins
Usage: !ladminpredict

### !fpredict / !faddpredict
Description: Force adding an user's prediction when Prediction has been closed
Usage: !fpredict NightBot 13-9

## For Twitch Channel Mods (Twitch Channel Owner can use too!)
### !fmodpredict
Description: Force adding an user's prediction when Prediction has been closed
Usage: !fmodpredict NightBot 13-9

### !openpredict / !opredict / !op
Description: Open a new prediction (WARN: Previous data will be cleared)
Usage: !opredict

### !closepredict / !cpredict / !cp
Description: Close predictions
Usage: !cpredict

### !wonpredict / !wpredict / !wp / !resultpredict / !rpredict / !rp
Description: Set result and show winners (Prediction System needs to be closed first)
Usage: !wpredict 13-10

## For Assigned Twitch Channel Prediction Admins (No other access like Twitch Channel Mods)
### !fadminpredict
Description: Force adding an user's prediction when Prediction has been closed!
Usage: !fadminpredict NightBot 13-9

</details>