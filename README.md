# QuickApply
https://www.youtube.com/watch?v=J9BXcEqUlF4

Writing this README with very little sleep and time, it's probably useless:

To run locally, you need the tesseract binaries installed on your machine and in your path.

You'll need a `.env` file in backend with values for a MongoDB connection string and SENDGRID_API_KEY
You'll need a `.env` file in frontend with values for the backend url

In frontend folder, and run `npm start`
In backend folder, install requirements and run:
```
export FLASK_APP=app.py   
flask run
```

Ran out of time to test these instructions on a fresh env or just setup Docker and host the project
