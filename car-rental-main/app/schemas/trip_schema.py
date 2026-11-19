from marshmallow import Schema, fields, validate, validates_schema, ValidationError
from datetime import datetime

class TripCreateSchema(Schema):
    route_id = fields.Int(required=True)
    bus_id = fields.Int(required=True)
    departure_time = fields.DateTime(required=True)
    arrival_time = fields.DateTime(required=True)
    price = fields.Float(required=True)
    status = fields.Str(validate=validate.OneOf(['scheduled', 'cancelled', 'completed', 'archived']))
    recurrence_rule = fields.Str(allow_none=True)
    is_round_trip = fields.Boolean(load_default=False)
    capacity = fields.Int(load_default=0)
    maintenance_window = fields.Dict(keys=fields.Str(), values=fields.Str(), allow_none=True)

    @validates_schema
    def validate_times(self, data, **kwargs):
        if data['arrival_time'] <= data['departure_time']:
            raise ValidationError('arrival_time must be after departure_time')

class TripUpdateSchema(Schema):
    departure_time = fields.DateTime()
    arrival_time = fields.DateTime()
    price = fields.Float()
    status = fields.Str(validate=validate.OneOf(['scheduled', 'cancelled', 'completed', 'archived']))
    recurrence_rule = fields.Str(allow_none=True)
    is_round_trip = fields.Boolean()
    capacity = fields.Int()
    occupied_seats = fields.Int()
    maintenance_window = fields.Dict(keys=fields.Str(), values=fields.Str(), allow_none=True)

    @validates_schema
    def validate_times(self, data, **kwargs):
        if 'departure_time' in data and 'arrival_time' in data:
            if data['arrival_time'] <= data['departure_time']:
                raise ValidationError('arrival_time must be after departure_time')

class TripReadSchema(Schema):
    id = fields.Int()
    route_id = fields.Int()
    bus_id = fields.Int()
    departure_time = fields.DateTime()
    arrival_time = fields.DateTime()
    price = fields.Float()
    status = fields.Str()
    recurrence_rule = fields.Str(allow_none=True)
    is_round_trip = fields.Boolean()
    parent_trip_id = fields.Int(allow_none=True)
    capacity = fields.Int()
    occupied_seats = fields.Int()
    maintenance_window = fields.Dict(allow_none=True)
