import { QUALITY_PRESENTATION, ratingOf } from '#badeplasser/quality.ts'
import type { Badeplass } from '#badeplasser/schema.ts'
import { formatDistanceToNowStrict } from 'date-fns'

const exactDate = new Intl.DateTimeFormat('nb-NO', { dateStyle: 'long' })

/** Relative time (e.g. «3 days ago»), with the exact date as a tooltip. */
const Measured = ({ iso }: { iso: string }) => {
	const date = new Date(iso)
	return (
		<time dateTime={iso} title={exactDate.format(date)}>
			{formatDistanceToNowStrict(date, { addSuffix: true })}
		</time>
	)
}

/** The detail card shown when a bathing spot marker is opened. */
export const BeachPopup = ({ beach }: { beach: Badeplass }) => {
	const rating = ratingOf(beach.waterQuality)
	const { color, label } = QUALITY_PRESENTATION[rating]
	const measuredAt = beach.waterQuality?.measuredAt ?? null

	return (
		<div class="beach-popup">
			<h3 class="beach-popup__title">
				<a href={beach.url} target="_blank" rel="noreferrer">
					{beach.name}
				</a>
			</h3>

			<div class="beach-popup__quality">
				<span class="beach-popup__badge" style={{ backgroundColor: color }}>
					{beach.waterQuality?.label ?? label}
				</span>
				<span class="beach-popup__measured">
					{measuredAt !== null ? (
						<>
							Badevannskvalitet · sist målt <Measured iso={measuredAt} />
						</>
					) : (
						<>Badevannskvalitet måles ikke her</>
					)}
				</span>
			</div>

			{beach.waterQuality?.description !== undefined &&
				beach.waterQuality.description.length > 0 && (
					<p class="beach-popup__description">
						{beach.waterQuality.description}
					</p>
				)}

			{beach.temperature !== undefined && (
				<p class="beach-popup__temperature">
					🌡️ {beach.temperature.celsius} °C
					{beach.temperature.measuredAt !== null && (
						<span class="beach-popup__measured">
							{' '}
							(målt <Measured iso={beach.temperature.measuredAt} />)
						</span>
					)}
				</p>
			)}

			{beach.facilities.length > 0 && (
				<div class="beach-popup__facilities">
					<h4>Fasiliteter</h4>
					{beach.facilities.map((section) => (
						<div key={section.heading}>
							{section.heading !== 'Fasiliteter' && <h5>{section.heading}</h5>}
							<ul>
								{section.items.map((item, i) => (
									<li key={i}>{item}</li>
								))}
							</ul>
						</div>
					))}
				</div>
			)}
		</div>
	)
}
