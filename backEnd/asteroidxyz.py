import math
import numpy as np

# Fiziksel sabitler
G = 6.67430e-11       # m^3 kg^-1 s^-2
M = 5.972e24          # Dünya kütlesi (kg)
R_EARTH = 6.371e6     # Dünya yarıçapı (m)

# Simülasyon parametreleri
dt = 0.5               # zaman adımı (s)
max_steps = 20000      # maksimum adım sayısı

# Cisim parametreleri (örnek)
mass = 100000.0        # kg
position0 = np.array([0.0, 1e7, 0.0])   # başlangıç pozisyonu (m)
velocity0 = np.array([6000.0,1000.0, 200.0])  # başlangıç hız vektörü (m/s)

def gravity_acceleration(pos):
    """Posisyona bağlı ivme a = F/m (m/s^2). Dünya merkezinden gelen çekim."""
    r = np.linalg.norm(pos)
    if r == 0:
        return np.zeros(3)
    a_mag = -G * M / (r ** 2)
    return a_mag * (pos / r)

def rk4_step(pos, vel, dt):
    """RK4 adımı: giriş pos, vel; çıkış pos_new, vel_new."""
    def acc(p):
        return gravity_acceleration(p)

    k1_v = acc(pos)
    k1_p = vel

    k2_v = acc(pos + 0.5 * dt * k1_p)
    k2_p = vel + 0.5 * dt * k1_v

    k3_v = acc(pos + 0.5 * dt * k2_p)
    k3_p = vel + 0.5 * dt * k2_v

    k4_v = acc(pos + dt * k3_p)
    k4_p = vel + dt * k3_v

    vel_new = vel + (dt / 6.0) * (k1_v + 2 * k2_v + 2 * k3_v + k4_v)
    pos_new = pos + (dt / 6.0) * (k1_p + 2 * k2_p + 2 * k3_p + k4_p)

    return pos_new, vel_new

def simulate(position0, velocity0, dt=0.5, max_steps=20000, crash_on_surface=True):
    """
    Simülasyonu yürütür ve dizileri döndürür:
    x, y, z: (N,) pozisyon bileşenleri
    velocities: (N,3)
    accelerations: (N,3)
    terminated: sözlük ile durum bilgisi {'crashed': bool, 'steps': int}
    """
    pos = position0.astype(float).copy()
    vel = velocity0.astype(float).copy()

    # Ön ayarlar
    xs = []
    ys = []
    zs = []
    velocities = []
    accelerations = []

    crashed = False
    step = 0

    while step < max_steps:
        r = np.linalg.norm(pos)
        a = gravity_acceleration(pos)

        # Kayıt
        xs.append(pos[0])
        ys.append(pos[1])
        zs.append(pos[2])
        velocities.append(vel.copy())
        accelerations.append(a.copy())

        # Çarpışma kontrolü
        if crash_on_surface and r <= R_EARTH:
            crashed = True
            break

        # Entegrasyon adımı (RK4)
        pos, vel = rk4_step(pos, vel, dt)

        step += 1

    # Convert to numpy arrays
    xs = np.array(xs)
    ys = np.array(ys)
    zs = np.array(zs)
    velocities = np.array(velocities)        # shape = (N,3)
    accelerations = np.array(accelerations)  # shape = (N,3)

    terminated = {'crashed': crashed, 'steps': step, 'final_r': np.linalg.norm(pos)}

    return xs, ys, zs, velocities, accelerations, terminated

# Eğer doğrudan çalıştırılıyorsa örnek bir simülasyon yap
if __name__ == '__main__':
    x, y, z, v, a, info = simulate(position0, velocity0, dt=dt, max_steps=max_steps)
    print(f"Adımlar: {info['steps']}, Çarpıştı: {info['crashed']}, Son yarıçap: {info['final_r']:.3e} m")
    # Örnek: ilk 5 adımı yazdır
    for i in range(min(5, x.size)):
        print(f"Step {i}: pos=({x[i]:.3e}, {y[i]:.3e}, {z[i]:.3e}), v=({v[i,0]:.3e},{v[i,1]:.3e},{v[i,2]:.3e}), a=({a[i,0]:.3e},{a[i,1]:.3e},{a[i,2]:.3e})")

def get_variables():
    x, y, z, v, a, info = simulate(position0, velocity0, dt=dt, max_steps=max_steps)
    print(f"Adımlar: {info['steps']}, Çarpıştı: {info['crashed']}, Son yarıçap: {info['final_r']:.3e} m")
    # Örnek: ilk 5 adımı yazdır
    for i in range(max_steps):
        return { "asteroidX":x[i],
                "asteroidY":y[i],
                "asteroidZ":z[i],
                "velocityX":v[i,0],
                "velocityY":v[i,1],
                "velocityZ":v[i,2],
                "accelerationX":a[i,0],
                "accelerationY":a[i,0],
                "accelerationZ":a[i,0],
                }