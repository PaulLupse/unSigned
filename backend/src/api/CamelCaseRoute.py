from fastapi.routing import APIRoute

''' 
    Tip de endpoint ce permite "traducerea" numelor de câmpuri ale modelelor pidantice returnate ca și response body.
    Are efect asupra tuturor rutelor ce aparțin router-ului avănd setat "route_class" la această clasă.
'''
class CamelCaseRoute(APIRoute):
    def __init__(self, *args, **kwargs):
        kwargs.setdefault("response_model_by_alias", True)
        super().__init__(*args, **kwargs)
