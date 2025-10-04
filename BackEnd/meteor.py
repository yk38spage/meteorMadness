
import matplotlib.pyplot as plt
from matplotlib.animation import FuncAnimation
import numpy as np


def meteor_dynamics(t, y, mass, drag_coefficient, area, air_density):
    velocity = y[1]
    gravity = 9.81
    drag_force = 0.5 * air_density * velocity**2 * drag_coefficient * area
    acceleration = -gravity - (drag_force / mass)
    return [velocity, acceleration]

fig, ax = plt.subplots()
meteor, = plt.plot([], [], 'ro')

def init():
    ax.set_xlim(0, 100)
    ax.set_ylim(0, 100)
    return meteor,

def update(frame):
    x = frame
    y = 100 - 0.5 * 9.81 * (frame**2) / 1000  # basit düşüş
    meteor.set_data(x, y)
    return meteor,

ani = FuncAnimation(fig, update, frames=np.linspace(0, 10, 100), init_func=init)
plt.show()