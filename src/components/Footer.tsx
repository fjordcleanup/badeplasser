import { Ago } from '#components/Ago.tsx'

import './Footer.css'

const CopyrightYear = () => {
	const currentYear = new Date().getFullYear()

	return <>{currentYear}</>
}

export const Footer = () => (
	<footer class="mt-4 page-footer">
		<main>
			<span class="copyright">
				© <CopyrightYear /> <a href="https://coderbyheart.com">Markus Tacker</a>
				. All rights reserved.
			</span>
			<nav>
				<a target="_blank" href="https://fjordcleanup.no/">
					Fjord CleanUP
				</a>
				<a target="_blank" href="https://github.com/fjordcleanup/badeplasser">
					Source
				</a>
			</nav>
		</main>
		<aside class="appInfo">
			<span>{VERSION}</span>
			<span>
				built <Ago date={new Date(BUILD_TIME)} key={BUILD_TIME} /> ago
			</span>
		</aside>
	</footer>
)
