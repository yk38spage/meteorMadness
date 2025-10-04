import math
import numpy as np
import matplotlib.pyplot as plt
from mpl_toolkits.mplot3d import Axes3D
from matplotlib.animation import FuncAnimation

# Fiziksel sabitler
G = 6.67430e-11  # m^3 kg^-1 s^-2
M = 5.972e24  # Dünya kütlesi (kg)
R_EARTH = 6.371e6  # Dünya yarıçapı (m)

# Simülasyon parametreleri
dt = 0.5  # zaman adımı (s) - stabilite için artırıldı
FPS = 60
interval_ms = int(1/FPS)

# Cisim parametreleri
mass = 100000.0  # kg
position = np.array([0.0, 1e7, 0.0])  # metre
velocity = np.array([5000.0, 2000.0, 200.0])  # m/s


def calculate_gravity_force(pos, m=mass):
    """Yerçekimi kuvvetini hesapla"""
    r = np.linalg.norm(pos)
    if r == 0:
        return np.zeros(3)
    force_magnitude = G * M * m / (r ** 2)
    force = -force_magnitude * (pos / r)
    return force


def rk4_step(pos, vel, dt):
    """4. dereceden Runge-Kutta integrasyonu (daha stabil)"""

    def acceleration(p):
        force = calculate_gravity_force(p)
        return force / mass

    # k1
    k1_v = acceleration(pos)
    k1_p = vel

    # k2
    k2_v = acceleration(pos + 0.5 * dt * k1_p)
    k2_p = vel + 0.5 * dt * k1_v

    # k3
    k3_v = acceleration(pos + 0.5 * dt * k2_p)
    k3_p = vel + 0.5 * dt * k2_v

    # k4
    k4_v = acceleration(pos + dt * k3_p)
    k4_p = vel + dt * k3_v

    # Yeni değerler
    vel_new = vel + (dt / 6.0) * (k1_v + 2 * k2_v + 2 * k3_v + k4_v)
    pos_new = pos + (dt / 6.0) * (k1_p + 2 * k2_p + 2 * k3_p + k4_p)

    return pos_new, vel_new


def euler_step(pos, vel, dt):
    """Basit Euler integrasyonu (hızlı ama daha az stabil)"""
    force = calculate_gravity_force(pos)
    acc = force / mass
    vel_new = vel + acc * dt
    pos_new = pos + vel_new * dt
    return pos_new, vel_new


def calculate_energy(pos, vel):
    """Toplam mekanik enerji (kinetik + potansiyel)"""
    r = np.linalg.norm(pos)
    kinetic = 0.5 * mass * np.linalg.norm(vel) ** 2
    potential = -G * M * mass / r
    return kinetic + potential


def create_sphere(radius, resolution=32):
    """Dünya için küre mesh oluştur"""
    u = np.linspace(0, 2*np.pi, resolution)
    v = np.linspace(0, np.pi, resolution)
    x = radius * np.outer(np.cos(u), np.sin(v))
    y = radius * np.outer(np.sin(u), np.sin(v))
    z = (4/3)*radius * np.outer(np.ones(np.size(u)), np.cos(v))
    return x, y, z


# Veri deposu
max_steps = 10000
trail = np.zeros((max_steps, 3))
trail_len = 1000

# Matplotlib ayarları
fig = plt.figure(figsize=(32, 32))
ax = fig.add_subplot(111, projection='3d')
ax.set_xlabel('X (m)', fontsize=10)
ax.set_ylabel('Y (m)', fontsize=10)
ax.set_zlabel('Z (m)', fontsize=10)
ax.set_title('Yerçekimi Simülasyonu (RK4 Yöntemi)', fontsize=12)

# Dünya'yı çiz
earth_x, earth_y, earth_z = create_sphere(R_EARTH)
ax.plot_surface(earth_x, earth_y, earth_z, color='blue', alpha=0.6, shade=True)

# Başlangıç sınırları
max_range = 1.5e8
ax.set_xlim(-max_range, max_range)
ax.set_ylim(-max_range, max_range)
ax.set_zlim(-max_range, max_range)

# Çizgiler ve nokta
line, = ax.plot([], [], [], color='red', lw=1.5, label='Yörünge')
point, = ax.plot([], [], [], marker='o', color='yellow', markersize=8)

# Enerji ve hız bilgisi için text
info_text = ax.text2D(0.02, 0.95, '', transform=ax.transAxes, fontsize=9,
                      verticalalignment='top', family='monospace')

ax.legend(loc='upper right')

# Global state
state_pos = position.copy()
state_vel = velocity.copy()
step_count = 0
initial_energy = calculate_energy(state_pos, state_vel)
crashed = False


def init():
    line.set_data([], [])
    line.set_3d_properties([])
    point.set_data([], [])
    point.set_3d_properties([])
    info_text.set_text('')
    return line, point, info_text


def update(frame):
    global state_pos, state_vel, trail, step_count, crashed

    if crashed:
        return line, point, info_text

    # Çarpışma kontrolü
    r = np.linalg.norm(state_pos)
    if r < R_EARTH:
        crashed = True
        info_text.set_text(f'ÇARPIŞMA! Adım: {step_count}\nYükseklik: {(r - R_EARTH) / 1000:.1f} km')
        return line, point, info_text

    # RK4 adımı at (daha stabil, Euler için euler_step kullanın)
    state_pos, state_vel = rk4_step(state_pos, state_vel, dt)

    # Trail güncelle
    trail = np.roll(trail, -1, axis=0)
    trail[-1] = state_pos
    step_count += 1

    # Çizilecek trail
    start = max(0, max_steps - min(step_count, trail_len))
    seg = trail[start:max_steps]

    if seg.size == 0:
        xs, ys, zs = [], [], []
    else:
        xs, ys, zs = seg[:, 0], seg[:, 1], seg[:, 2]

    line.set_data(xs, ys)
    line.set_3d_properties(zs)
    point.set_data([state_pos[0]], [state_pos[1]])
    point.set_3d_properties([state_pos[2]])

    # Bilgi metni
    current_energy = calculate_energy(state_pos, state_vel)
    energy_change = abs((current_energy - initial_energy) / initial_energy) * 100
    altitude = (r - R_EARTH) / 1000  # km
    speed = np.linalg.norm(state_vel) / 1000  # km/s

    info_str = (f'Adım: {step_count}\n'
                f'Yükseklik: {altitude:.1f} km\n'
                f'Hız: {speed:.3f} km/s\n'
                f'Enerji Değişimi: {energy_change:.2e}%')
    info_text.set_text(info_str)

    # Her 100 adımda konsol çıktısı
    if step_count % 100 == 0:
        print(f"Adım {step_count}: Yükseklik = {altitude:.1f} km, Hız = {speed:.3f} km/s")

    return line, point, info_text


anim = FuncAnimation(fig, update, init_func=init, frames=max_steps,
                     interval=interval_ms, blit=True, repeat=False)

plt.tight_layout()
plt.show()