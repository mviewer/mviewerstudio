FROM python:3.8-slim
RUN useradd -r -m apprunner
USER apprunner
ENV HOME=/home/apprunner
ENV PATH=$HOME/.local/bin:$PATH
WORKDIR /home/apprunner
COPY . .
RUN pip install --user . && pip install --user gunicorn

CMD ["gunicorn", "-w 4", "-b 0.0.0.0:8000", "mviewerstudio_backend.app:app"]