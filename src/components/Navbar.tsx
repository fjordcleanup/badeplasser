import { HelpCircle, Menu, Shield, WavesHorizontal, X } from 'lucide-preact'
import { useState } from 'preact/hooks'

import './Navbar.css'

export const Navbar = () => <Nav />

const Nav = () => {
	const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)

	const toggleMobileMenu = () => setIsMobileMenuOpen(!isMobileMenuOpen)
	const closeMobileMenu = () => setIsMobileMenuOpen(false)

	return (
		<div class="topNav">
			<nav class="left d-flex">
				<img
					src="/static/fjordcleanup-logo-2025.svg"
					alt="Fjord CleanUP"
					class="logo"
				/>
				<div class="desktop-nav">
					<a href="/" class="ms-2 d-flex align-items-center me-2">
						<WavesHorizontal class="me-2" /> Badeplasser
					</a>
					<a href="/about" class="ms-2 d-flex align-items-center me-2">
						<HelpCircle class="me-2" /> About
					</a>
					<a
						href="https://fjordcleanup.no"
						class="ms-2 d-flex align-items-center"
						target="_blank"
					>
						<Shield class="me-2" /> 
						Fjord CleanUP
					</a>
				</div>
			</nav>
			<nav class="right">
				<button
					type="button"
					class="mobile-menu-toggle"
					onClick={toggleMobileMenu}
					aria-label="Toggle mobile menu"
				>
					{isMobileMenuOpen ? <X /> : <Menu />}
				</button>
			</nav>

			{/* Mobile Menu */}
			{isMobileMenuOpen && (
				<div class="mobile-menu">
					<div class="mobile-menu-content">
						<a href="/" class="mobile-menu-item" onClick={closeMobileMenu}>
							<WavesHorizontal /> Badeplasser
						</a>
						<a href="/about" class="mobile-menu-item" onClick={closeMobileMenu}>
							<HelpCircle /> About
						</a>
						<a href="https://fjordcleanup.no" class="mobile-menu-item" onClick={closeMobileMenu} target="_blank">
							<Shield /> Fjord CleanUP
						</a>
					</div>
				</div>
			)}
		</div>
	)
}
