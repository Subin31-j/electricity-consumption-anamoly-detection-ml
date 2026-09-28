"""Utility helpers shared across the backend."""


def mask_consumer_number(consumer_number: str) -> str:
    """Mask an 11-digit consumer number as e.g. 123*****901."""
    if not consumer_number:
        return ""
    if len(consumer_number) <= 6:
        return consumer_number[0] + "*" * (len(consumer_number) - 1)
    head = consumer_number[:3]
    tail = consumer_number[-3:]
    middle = "*" * (len(consumer_number) - 6)
    return f"{head}{middle}{tail}"
