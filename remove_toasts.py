import os
import re

files = [f for f in os.listdir('.') if f.endswith('.html')]

for filepath in files:
    with open(filepath, 'r') as f:
        content = f.read()

    # Pattern to remove the Toast Notification block
    pattern = re.compile(r'<!-- Toast Notification -->.*?</div>\s*</div>\s*</div>', re.DOTALL)
    content = pattern.sub('', content)

    pattern2 = re.compile(r'<!-- Toast Container -->.*?</div>\s*</div>\s*</div>', re.DOTALL)
    content = pattern2.sub('', content)

    with open(filepath, 'w') as f:
        f.write(content)
