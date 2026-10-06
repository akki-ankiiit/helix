import re

path = 'src/components/ui/LiquidOrb.tsx'
with open(path, 'r') as f:
    content = f.read()

parts = content.split('const shaderSource = `', 1)
if len(parts) == 2:
    subparts = parts[1].rsplit('`;\n\nconst stateSeeds = {', 1)
    if len(subparts) == 2:
        shader = subparts[0]
        # Remove any existing backslashes before backticks
        shader = re.sub(r'\\+`', '`', shader)
        # Escape all backticks with a single backslash
        shader = shader.replace('`', '\\`')
        new_content = parts[0] + 'const shaderSource = `' + shader + '`;\n\nconst stateSeeds = {' + subparts[1]
        with open(path, 'w') as f:
            f.write(new_content)
        print('Fixed LiquidOrb.tsx')
