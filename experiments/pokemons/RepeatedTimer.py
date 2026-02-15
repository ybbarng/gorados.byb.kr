from threading import Timer

# If want to do forever, set times -1
class RepeatedTimer(object):
    def __init__(self, times, interval, function, *args, **kwargs):
        self._timer     = None
        self.times = times
        self.interval   = interval
        self.function   = function
        self.args       = args
        self.kwargs     = kwargs
        self.is_running = False
        self.start()

    def _run(self):
        self.is_running = False
        if self.times != 0 :
            self.start()
            if self.times != -1 :
                self.times = self.times - 1
        self.function(*self.args, **self.kwargs)

    def start(self):
        if not self.is_running:
            self._timer = Timer(self.interval, self._run)
            self._timer.start()
            self.is_running = True

    def stop(self):
        self._timer.cancel()
        self.is_running = False


