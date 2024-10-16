import { getGroups, getGroupContacts } from './api';
import SendMessage from './SendMessage'; // Import SendMessage component
import './styles.css';

function GroupView() {
    let groups = [];
    let activeGroup = null;
    let groupContacts = [];

    // Function to fetch groups
    const fetchGroups = async () => {
        try {
            const response = await getGroups();
            groups = response.data; // Assign fetched groups to the variable
            renderGroups(); // Render groups after fetching
        } catch (error) {
            console.error('Error fetching groups:', error);
        }
    };

    // Function to fetch contacts of the selected group
    const fetchGroupContacts = async (groupId) => {
        try {
            const response = await getGroupContacts(groupId);
            activeGroup = groupId; // Set active group
            groupContacts = response.data; // Assign fetched contacts to the variable
            renderGroups(); // Re-render to show contacts
        } catch (error) {
            console.error('Error fetching group contacts:', error);
        }
    };

    // Function to render groups
    const renderGroups = () => {
        const groupList = document.querySelector('.group-list');
        groupList.innerHTML = ''; // Clear previous content

        groups.forEach(group => {
            const groupItem = document.createElement('li');
            groupItem.className = 'group-item';
            groupItem.innerHTML = `
                <span
                    onclick="handleGroupClick(${group.id})"
                    class="group-name clickable"
                >
                    ${group.name}
                </span>
                ${activeGroup === group.id ? renderContacts() : ''}
            `;
            groupList.appendChild(groupItem);
        });
    };

    // Function to render contacts
    const renderContacts = () => {
        return `
            <ul class="contact-list">
                ${groupContacts.map(contact => `
                    <li key=${contact.id} class="contact-item">
                        ${contact.name} - <span class="contact-phone">${contact.phone}</span>
                    </li>
                `).join('')}
            </ul>
        `;
    };

    // Function to handle group clicks
    const handleGroupClick = (groupId) => {
        if (activeGroup === groupId) {
            activeGroup = null; // Deselect group
            groupContacts = []; // Clear contacts
        } else {
            fetchGroupContacts(groupId); // Fetch contacts for selected group
        }
    };

    // Call fetchGroups when the component is loaded
    fetchGroups();

    return (
        <div className="group-view">
            <h2>Groups</h2>
            <ul className="group-list"></ul>

            {/* Include SendMessage component and pass groups */}
            <SendMessage groups={groups} />
        </div>
    );
}

export default GroupView;
