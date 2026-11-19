from app import db
from app.models import Trip, TripSchedule, Route, Bus, Agency
from datetime import datetime, timedelta, date


# Cameroon timezone offset (WAT = UTC+1)
WAT_OFFSET = timedelta(hours=1)


def _now_wat():
    """Current time in West Africa Time (UTC+1)."""
    return datetime.utcnow() + WAT_OFFSET


def _today_wat():
    """Current date in West Africa Time."""
    return _now_wat().date()


def check_conflict(bus_id, departure_time, arrival_time, exclude_id=None):
    """Return True if the bus has an overlapping scheduled trip."""
    if isinstance(departure_time, str):
        departure_time = datetime.fromisoformat(departure_time)
    if isinstance(arrival_time, str):
        arrival_time = datetime.fromisoformat(arrival_time)

    query = Trip.query.filter(
        Trip.bus_id == bus_id,
        Trip.status != 'cancelled',
        Trip.is_deleted == False,
        Trip.departure_time < arrival_time,
        Trip.arrival_time > departure_time
    )
    if exclude_id:
        query = query.filter(Trip.id != exclude_id)
    return query.first() is not None


def create_round_trip(original_trip):
    """Create a return leg for the given trip."""
    return_trip = Trip(
        route_id=original_trip.route_id,
        bus_id=original_trip.bus_id,
        departure_time=original_trip.arrival_time,
        arrival_time=original_trip.arrival_time,  # placeholder – admin should update
        price=original_trip.price,
        status='scheduled',
        is_round_trip=True,
        parent_trip_id=original_trip.id,
        capacity=original_trip.capacity,
        booking_cutoff_minutes=original_trip.booking_cutoff_minutes,
    )
    db.session.add(return_trip)
    db.session.commit()
    return return_trip


# ============================================================
# BOOKABILITY ENGINE
# ============================================================

def _base_bookable_query():
    """Base query filtering for bookable trips (not deleted, not cancelled, future departure)."""
    now = _now_wat()
    return Trip.query.options(db.joinedload(Trip.bus)).filter(
        Trip.is_deleted == False,
        Trip.is_archived == False,
        Trip.status.notin_(['cancelled', 'completed', 'arrived']),
        Trip.departure_time > now
    )


def get_bookable_trips(origin=None, destination=None, search_date=None, agency_id=None):
    """Return trips that are currently bookable, with optional filters.
    
    Filters out:
    - Past trips
    - Cancelled / completed trips
    - Fully booked trips
    - Trips whose booking window is closed (cutoff passed)
    """
    query = _base_bookable_query().join(Route)
    
    if origin:
        query = query.filter(Route.origin.ilike(f'%{origin}%'))
    if destination:
        query = query.filter(Route.destination.ilike(f'%{destination}%'))
    if search_date:
        if isinstance(search_date, str):
            try:
                search_date = datetime.strptime(search_date, '%Y-%m-%d').date()
            except ValueError:
                search_date = datetime.strptime(search_date, '%d/%m/%Y').date()
        query = query.filter(db.func.date(Trip.departure_time) == search_date)
    if agency_id:
        query = query.filter(Route.agency_id == agency_id)
    
    trips = query.order_by(Trip.departure_time.asc()).all()
    
    # Post-filter: only trips that are still BOOKING_OPEN
    return [t for t in trips if t.booking_status == 'BOOKING_OPEN']


def get_upcoming_trips(limit=3):
    """Get the next N bookable trips for homepage display.
    
    Returns trips across all routes, ordered by departure time.
    Only includes trips with BOOKING_OPEN status.
    """
    now = _now_wat()
    # Fetch more than needed to account for post-filtering
    trips = _base_bookable_query().join(Route).order_by(
        Trip.departure_time.asc()
    ).limit(limit * 3).all()
    
    # Post-filter for truly bookable trips
    bookable = [t for t in trips if t.booking_status == 'BOOKING_OPEN']
    return bookable[:limit]


def get_search_results(origin=None, destination=None, search_date=None, 
                       time_filter=None, agency_id=None):
    """Enhanced search with day grouping for the search page.
    
    Returns a dict:
    {
        'today': [trips],
        'tomorrow': [trips],
        'upcoming': [trips],  # day after tomorrow onwards
        'total_count': int
    }
    """
    today = _today_wat()
    tomorrow = today + timedelta(days=1)
    
    query = _base_bookable_query().join(Route).options(
        db.contains_eager(Trip.route).joinedload(Route.agency)
    )
    
    if origin:
        query = query.filter(Route.origin.ilike(f'%{origin}%'))
    if destination:
        query = query.filter(Route.destination.ilike(f'%{destination}%'))
    if agency_id:
        query = query.filter(Route.agency_id == agency_id)
    
    # Date and Time filtering
    if search_date:
        if isinstance(search_date, str):
            try:
                search_date = datetime.strptime(search_date, '%Y-%m-%d').date()
            except ValueError:
                search_date = datetime.strptime(search_date, '%d/%m/%Y').date()
                
        # Instead of strict date equality, we construct a time range.
        # This fixes 'night' trips spanning into the next day.
        start_time = datetime.combine(search_date, datetime.min.time())
        end_time = datetime.combine(search_date, datetime.max.time())
        
        if time_filter:
            if time_filter == 'morning':
                start_time = start_time.replace(hour=5)
                end_time = start_time.replace(hour=11, minute=59, second=59)
            elif time_filter == 'afternoon':
                start_time = start_time.replace(hour=12)
                end_time = start_time.replace(hour=16, minute=59, second=59)
            elif time_filter == 'evening':
                start_time = start_time.replace(hour=17)
                end_time = start_time.replace(hour=20, minute=59, second=59)
            elif time_filter == 'night':
                start_time = start_time.replace(hour=21)
                # Night ends at 5 AM the NEXT day
                end_time = (start_time + timedelta(days=1)).replace(hour=4, minute=59, second=59)
                
        query = query.filter(Trip.departure_time >= start_time, Trip.departure_time <= end_time)
    else:
        # If no specific date is searched, but time_filter is provided (e.g. Quick Filters)
        if time_filter:
            if time_filter == 'morning':
                query = query.filter(db.extract('hour', Trip.departure_time) >= 5,
                                     db.extract('hour', Trip.departure_time) < 12)
            elif time_filter == 'afternoon':
                query = query.filter(db.extract('hour', Trip.departure_time) >= 12,
                                     db.extract('hour', Trip.departure_time) < 17)
            elif time_filter == 'evening':
                query = query.filter(db.extract('hour', Trip.departure_time) >= 17,
                                     db.extract('hour', Trip.departure_time) < 21)
            elif time_filter == 'night':
                query = query.filter(
                    db.or_(
                        db.extract('hour', Trip.departure_time) >= 21,
                        db.extract('hour', Trip.departure_time) < 5
                    )
                )
    
    trips = query.order_by(Trip.departure_time.asc()).all()
    
    # Post-filter for bookable only
    bookable = [t for t in trips if t.booking_status == 'BOOKING_OPEN']
    
    # Group by day
    today_trips = []
    tomorrow_trips = []
    upcoming_trips = []
    
    for trip in bookable:
        trip_date = trip.departure_time.date()
        if trip_date == today:
            today_trips.append(trip)
        elif trip_date == tomorrow:
            tomorrow_trips.append(trip)
        else:
            upcoming_trips.append(trip)
    
    return {
        'today': today_trips,
        'tomorrow': tomorrow_trips,
        'upcoming': upcoming_trips,
        'total_count': len(bookable),
        'all': bookable
    }


def get_available_cities():
    """Get lists of unique origin and destination cities from active routes."""
    origins = db.session.query(Route.origin).filter(
        Route.is_deleted == False
    ).distinct().order_by(Route.origin).all()
    
    destinations = db.session.query(Route.destination).filter(
        Route.is_deleted == False
    ).distinct().order_by(Route.destination).all()
    
    # Combine and deduplicate
    all_cities = sorted(set(
        [o[0] for o in origins] + [d[0] for d in destinations]
    ))
    
    return all_cities


def get_available_agencies():
    """Get list of active agencies that have routes."""
    agencies = Agency.query.filter(
        Agency.is_deleted == False,
        Agency.is_suspended == False
    ).order_by(Agency.name).all()
    return agencies


# ============================================================
# SCHEDULE MATERIALIZATION ENGINE
# ============================================================

def generate_scheduled_trips(horizon_days=14):
    """Materialize TripSchedule entries into actual Trip rows.
    
    For each active schedule, generates Trip instances for the next
    `horizon_days` days, skipping dates that already have a Trip
    linked to the same schedule.
    
    Returns the number of new trips created.
    """
    today = _today_wat()
    end_date = today + timedelta(days=horizon_days)
    
    schedules = TripSchedule.query.filter(
        TripSchedule.is_active == True,
        TripSchedule.effective_from <= end_date
    ).all()
    
    days_map = {'MON': 0, 'TUE': 1, 'WED': 2, 'THU': 3, 'FRI': 4, 'SAT': 5, 'SUN': 6}
    created_count = 0
    
    for schedule in schedules:
        # Determine date range for this schedule
        start = max(today, schedule.effective_from)
        end = end_date
        if schedule.effective_until:
            end = min(end, schedule.effective_until)
        
        # Parse departure time
        try:
            hour, minute = map(int, schedule.departure_time_of_day.split(':'))
        except (ValueError, AttributeError):
            continue
        
        # Get existing trip dates for this schedule to avoid duplicates
        existing_dates = set()
        existing_trips = Trip.query.filter(
            Trip.schedule_id == schedule.id,
            Trip.is_deleted == False,
            db.func.date(Trip.departure_time) >= start,
            db.func.date(Trip.departure_time) <= end
        ).all()
        for t in existing_trips:
            existing_dates.add(t.departure_time.date())
        
        # Generate trips for each applicable day
        current_date = start
        while current_date <= end:
            # Check recurrence pattern
            should_create = False
            
            if schedule.recurrence_type == 'daily':
                should_create = True
            elif schedule.recurrence_type in ('weekly', 'specific_days'):
                selected_days = schedule.get_recurrence_days_list()
                day_nums = [days_map.get(d, -1) for d in selected_days]
                if current_date.weekday() in day_nums:
                    should_create = True
            
            if should_create and current_date not in existing_dates:
                dep_time = datetime(current_date.year, current_date.month, current_date.day, hour, minute)
                arr_time = dep_time + timedelta(minutes=schedule.duration_minutes)
                
                # Don't create trips in the past
                if dep_time > _now_wat():
                    trip = Trip(
                        route_id=schedule.route_id,
                        bus_id=schedule.bus_id,
                        driver_id=schedule.driver_id,
                        departure_time=dep_time,
                        arrival_time=arr_time,
                        price=schedule.price,
                        status='scheduled',
                        capacity=schedule.capacity,
                        booking_cutoff_minutes=schedule.booking_cutoff_minutes,
                        schedule_id=schedule.id,
                    )
                    db.session.add(trip)
                    created_count += 1
            
            current_date += timedelta(days=1)
    
    if created_count > 0:
        db.session.commit()
    
    return created_count
