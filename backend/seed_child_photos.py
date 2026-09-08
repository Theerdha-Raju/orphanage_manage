import os
import django
import urllib.request
import time

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'backend.settings')
django.setup()

from api.models import Child

# Curated high quality child/student portrait images from Unsplash (face cropped, 300x300)
BOY_PHOTOS = [
    "https://images.unsplash.com/photo-1543332164-6e82f355badc?w=300&h=300&fit=crop&crop=face",
    "https://images.unsplash.com/photo-1503919545889-aef636e10ad4?w=300&h=300&fit=crop&crop=face",
    "https://images.unsplash.com/photo-1485546246426-74dc88dec4d9?w=300&h=300&fit=crop&crop=face",
    "https://images.unsplash.com/photo-1508214751196-bcfd4ca60f91?w=300&h=300&fit=crop&crop=face",
    "https://images.unsplash.com/photo-1519456264917-42d0aa2e0625?w=300&h=300&fit=crop&crop=face",
    "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=300&h=300&fit=crop&crop=face",
    "https://images.unsplash.com/photo-1529626455594-4ff0802cfb7e?w=300&h=300&fit=crop&crop=face",
    "https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=300&h=300&fit=crop&crop=face",
    "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=300&h=300&fit=crop&crop=face",
    "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=300&h=300&fit=crop&crop=face"
]

GIRL_PHOTOS = [
    "https://images.unsplash.com/photo-1517841905240-472988babdf9?w=300&h=300&fit=crop&crop=face",
    "https://images.unsplash.com/photo-1524504388940-b1c1722653e1?w=300&h=300&fit=crop&crop=face",
    "https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=300&h=300&fit=crop&crop=face",
    "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=300&h=300&fit=crop&crop=face",
    "https://images.unsplash.com/photo-1517841905240-472988babdf9?w=300&h=300&fit=crop&crop=face",
    "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=300&h=300&fit=crop&crop=face",
    "https://images.unsplash.com/photo-1529626455594-4ff0802cfb7e?w=300&h=300&fit=crop&crop=face",
    "https://images.unsplash.com/photo-1488426862026-3ee34a7d66df?w=300&h=300&fit=crop&crop=face",
    "https://images.unsplash.com/photo-1502685104226-ee32379fefbe?w=300&h=300&fit=crop&crop=face",
    "https://images.unsplash.com/photo-1520813792240-56fc4a3765a7?w=300&h=300&fit=crop&crop=face"
]

def seed_photos():
    photos_dir = os.path.join('media', 'child_photos')
    os.makedirs(photos_dir, exist_ok=True)
    
    children = list(Child.objects.all().order_by('child_id'))
    print(f"Assigning profile pictures for {len(children)} children...")
    
    boy_idx = 0
    girl_idx = 0
    
    for c in children:
        gender = c.gender or 'Male'
        if gender == 'Female':
            img_url = GIRL_PHOTOS[girl_idx % len(GIRL_PHOTOS)]
            girl_idx += 1
        else:
            img_url = BOY_PHOTOS[boy_idx % len(BOY_PHOTOS)]
            boy_idx += 1
            
        safe_name = c.full_name.replace(" ", "_").replace("/", "_")
        filename = f"child_photo_{safe_name}_{c.child_id}.jpg"
        filepath = os.path.join(photos_dir, filename)
        rel_path = f"child_photos/{filename}"
        
        try:
            req = urllib.request.Request(img_url, headers={'User-Agent': 'Mozilla/5.0'})
            with urllib.request.urlopen(req, timeout=10) as resp, open(filepath, 'wb') as f:
                f.write(resp.read())
            c.photo = rel_path
            c.save()
            print(f"Saved photo for ID #{c.child_id} ({c.full_name}) -> {rel_path}")
        except Exception as e:
            # Fallback to UI avatars
            avatar_url = f"https://ui-avatars.com/api/?name={urllib.parse.quote(c.full_name)}&background=2563eb&color=fff&size=300"
            try:
                with urllib.request.urlopen(avatar_url, timeout=10) as resp, open(filepath, 'wb') as f:
                    f.write(resp.read())
                c.photo = rel_path
                c.save()
                print(f"Saved fallback avatar for ID #{c.child_id} ({c.full_name})")
            except Exception as e2:
                print(f"Failed to download photo for ID #{c.child_id}: {e2}")
        time.sleep(0.1)
        
    print("Done seeding profile photos!")

if __name__ == '__main__':
    seed_photos()
