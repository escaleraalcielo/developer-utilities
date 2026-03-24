import os
import re

files = [f for f in os.listdir('.') if f.endswith('.js')]

for file in files:
    with open(file, 'r') as f:
        content = f.read()

    # Generic replace for navigator.clipboard.writeText
    # This is a bit complex as we need to match blocks, let's use some targeted replaces

    # We will just do manual replace via sed or python script for specific patterns
