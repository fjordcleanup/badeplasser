import { Footer } from '#components/Footer.tsx'
import { Navbar } from '#components/Navbar.tsx'

import './About.css'

export const About = () => (
	<>
		<Navbar />
		<div class="push-apart">
			<main class="container">
				<div class="row justify-content-center">
					<div class="col-12 col-md-6 d-flex justify-content-center">
						<img
							src="/static/fjordcleanup-logo-2025.svg"
							alt="Fjord CleanUP"
							class="logo"
							style={{ width: '25%' }}
						/>
					</div>
				</div>
				<div class="row justify-content-center">
					<div class="col-12 col-md-6">
						<h1>About</h1>
					</div>
				</div>
				<div class="row justify-content-center">
					<div class="col-12 col-md-6">
						<h2>Contact</h2>
						<p>
							If you have any question, feel free to reach out to us at{' '}
							<a href="mailto:badeplasser@fjordcleanup.org">badeplasser@fjordcleanup.org</a>
							.
						</p>
					</div>
				</div>
				<div class="row justify-content-center">
					<div class="col-12 col-md-6">
						<h2>Feedback</h2>
						<p>
							If you have any feedback or suggestions about this app, please let
							us know in{' '}
							<a
								href="https://github.com/orgs/fjordcleanup/discussions"
								target="_blank"
							>
								our GitHub discussions
							</a>
							.
						</p>
					</div>
				</div>
			</main>
			<Footer />
		</div>
	</>
)
