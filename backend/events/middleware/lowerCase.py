from django.http import HttpResponseNotFound

class LowercaseMiddleware:
    def __init__(self, get_response):
        self.get_response = get_response

    def __call__(self, request):
        # Zamień URL na małe litery
        request.path_info = request.path_info.lower()
        response = self.get_response(request)
        # Obsługa sytuacji, gdy URL jest nieprawidłowy
        if response.status_code == 404:
            return HttpResponseNotFound("Strona nie została znaleziona.")
        return response
