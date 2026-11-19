import re

def is_valid_password(password: str, username: str = None, email: str = None) -> bool:
    """
    Validates that a password contains at least 8 characters,
    one lowercase letter, one digit, and one special character.
    Also ensures the password does not contain the username or email.
    """
    if not password:
        return False
    if len(password) < 8:
        return False
    if not re.search(r'[a-z]', password):
        return False
    if not re.search(r'\d', password):
        return False
    if not re.search(r'[^a-zA-Z0-9]', password):
        return False
        
    pwd_lower = password.lower()
    if username and username.lower() in pwd_lower:
        return False
    if email:
        email_prefix = email.split('@')[0].lower()
        if email_prefix and email_prefix in pwd_lower:
            return False
            
    return True

def is_valid_email(email: str) -> bool:
    """
    Validates an email address format.
    """
    if not email:
        return False
    return bool(re.match(r'^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$', email))

def is_valid_cameroon_phone(phone_number: str) -> bool:
    """
    Validates a Cameroonian phone number.
    Accepts 9 digits starting with 6 or 2, optionally prefixed with +237 or 237.
    """
    if not phone_number:
        return False
    clean_number = phone_number.replace(' ', '').replace('-', '')
    # Strip country code if present
    clean_number = re.sub(r'^(?:\+237|237)', '', clean_number)
    return bool(re.match(r'^(6|2)\d{8}$', clean_number))

def is_valid_phone(phone_number: str) -> bool:
    """
    Validates a generic phone number format (between 6 and 15 digits), optionally starting with a +.
    """
    if not phone_number:
        return False
    clean_number = phone_number.replace(' ', '').replace('-', '')
    return bool(re.match(r'^\+?\d{6,15}$', clean_number))
