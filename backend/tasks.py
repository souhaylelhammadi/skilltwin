from celery_app import celery_app


@celery_app.task(name="ping")
def ping():
    return "pong"