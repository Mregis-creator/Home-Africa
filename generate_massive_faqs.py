#!/usr/bin/env python3
"""
Generate thousands of FAQ variations for Rejo AI
This script creates comprehensive FAQ entries covering all aspects
"""

# Categories and their variations
categories = {
    'listings': ['apartments', 'houses', 'cars', 'land', 'properties'],
    'apartments': ['studio', '1br', '2br', '3br', 'furnished', 'unfurnished'],
    'cars': ['toyota', 'honda', 'nissan', 'suv', 'sedan', 'automatic', 'manual'],
    'land': ['plots', 'commercial', 'residential', 'farming'],
    'location': ['kigali', 'nyarugenge', 'gasabo', 'kicukiro', 'nyarutarama', 'kimisagara', 'remera'],
    'general': ['help', 'how', 'what', 'where', 'when', 'why'],
    'booking': ['viewing', 'appointment', 'schedule'],
    'pricing': ['cheap', 'affordable', 'budget', 'luxury', 'premium'],
}

# Question templates
templates = [
    ("{category}", "Do you have {item}"),
    ("{category}", "I need {item}"),
    ("{category}", "I want {item}"),
    ("{category}", "Looking for {item}"),
    ("{category}", "Searching for {item}"),
    ("{category}", "Find {item}"),
    ("{category}", "Show me {item}"),
    ("{category}", "Any {item} available"),
    ("{category}", "Got {item}"),
    ("{category}", "What {item} do you have"),
]

# This is a template - actual generation would create SQL INSERT statements
# For now, let's continue building the SQL file directly with more comprehensive content

print("FAQ generation template created. Continuing with direct SQL file building...")

