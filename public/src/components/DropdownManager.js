class DropdownManager {
    static show(triggerBtn, items) {
        DropdownManager.close();

        const menu = document.createElement('div');
        menu.className = 'floating-dropdown-menu';

        items.forEach(item => {
            const btn = document.createElement('button');
            btn.type = 'button';
            btn.className = `dropdown-item ${item.danger ? 'danger' : ''}`;
            btn.innerHTML = item.html;
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                DropdownManager.close();
                item.onClick();
            });
            menu.appendChild(btn);
        });

        document.body.appendChild(menu);

        const rect = triggerBtn.getBoundingClientRect();
        const menuWidth = 180;
        let left = Math.max(10, Math.min(rect.right - menuWidth, window.innerWidth - 190));
        let top = rect.bottom + 6;

        if (top + 120 > window.innerHeight) {
            top = Math.max(10, rect.top - 120);
        }

        menu.style.top = `${top}px`;
        menu.style.left = `${left}px`;

        setTimeout(() => {
            document.addEventListener('click', DropdownManager.handleOutsideClick);
        }, 10);
    }

    static close() {
        const existing = document.querySelector('.floating-dropdown-menu');
        if (existing) existing.remove();
        document.removeEventListener('click', DropdownManager.handleOutsideClick);
    }

    static handleOutsideClick(e) {
        if (!e.target.closest('.floating-dropdown-menu')) {
            DropdownManager.close();
        }
    }
}

window.DropdownManager = DropdownManager;
if (typeof module !== 'undefined') module.exports = DropdownManager;
