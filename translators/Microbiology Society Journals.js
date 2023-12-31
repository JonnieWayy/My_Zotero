{
	"translatorID": "ce5f2849-4500-47cc-8d7d-3fc0a1de9848",
	"translatorType": 4,
	"label": "Microbiology Society Journals",
	"creator": "Philipp Zumstein",
	"target": "^https?://(www\\.)?(\\w)+\\.microbiologyresearch\\.org/(content/journal/|search?)",
	"minVersion": "3.0",
	"maxVersion": null,
	"priority": 100,
	"inRepository": true,
	"browserSupport": "gcsibv",
	"lastUpdated": "2023-01-17 16:05:00"
}

/*
	***** BEGIN LICENSE BLOCK *****

	Copyright © 2016 Philipp Zumstein

	This file is part of Zotero.

	Zotero is free software: you can redistribute it and/or modify
	it under the terms of the GNU Affero General Public License as published by
	the Free Software Foundation, either version 3 of the License, or
	(at your option) any later version.

	Zotero is distributed in the hope that it will be useful,
	but WITHOUT ANY WARRANTY; without even the implied warranty of
	MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the
	GNU Affero General Public License for more details.

	You should have received a copy of the GNU Affero General Public License
	along with Zotero. If not, see <http://www.gnu.org/licenses/>.

	***** END LICENSE BLOCK *****
*/

function detectWeb(doc, url) {
	if (url.search(/\/content\/journal\/\w+\/10\./) > -1) {
		//e.g. http://jmm.microbiologyresearch.org/content/journal/jmm/10.1099/00222615-15-2-189
		return "journalArticle";
	}
	if (getSearchResults(doc, true)) {
		//e.g. http://ijs.microbiologyresearch.org/content/journal/ijsem/65/11
		//http://jmm.microbiologyresearch.org/search?option1=author&noRedirect=true&value1=Ateequr+Rehman&facetOptions=2&facetNames=pub_author_facet&operator2=AND&option2=pub_author_facet&value2=%27Patricia+Lepage%27
		return "multiple";
	}
	return false;
}

function getSearchResults(doc, checkOnly) {
	var items = {};
	var found = false;
	var rows = doc.querySelectorAll('h4.resultItem__title  > a');
	for (let row of rows) {
		let href = row.href;
		let title = ZU.trimInternal(row.textContent);
		if (!href || !title) continue;
		if (checkOnly) return true;
		found = true;
		items[href] = title;
	}
	return found ? items : false;
}


async function doWeb(doc, url) {
	if (detectWeb(doc, url) == 'multiple') {
		let items = await Zotero.selectItems(getSearchResults(doc, false));
		if (items) {
			await Promise.all(
				Object.keys(items)
					.map(url => requestDocument(url).then(scrape))
			);
		}
	}
	else {
		await scrape(doc, url);
	}
}

async function scrape(doc, url = doc.location.href) {
	var risURL;
	var node = ZU.xpath(doc, '//ul[@id="export-list"]/li/a[contains(@title,"RefWorks")]');
	if (node.length > 0) {
		risURL = node[0].href;
	}
	else {
		// Trim query string and hash
		url = url.replace(/(\?.*)?(#.*)?$/, '');
		risURL = url + "/cite/refworks";
	}

	ZU.doGet(risURL, function (text) {
		if (/A1\s+.+YR\s+\d{4}/.test(text)) {
			// they sometimes attach the year to the last author in the same line
			text = text.replace(/(A1\s+.+)(YR\s+\d{4})/, "$1\n$2");
		}
		// Z.debug(text)
		var translator = Zotero.loadTranslator("import");
		translator.setTranslator("1a3506da-a303-4b0a-a1cd-f216e6138d86");
		translator.setString(text);
		translator.setHandler("itemDone", function (obj, item) {
			var pdfURL = attr(doc, '.download-pdf form.ft-download-content__form--pdf', 'action');
			if (pdfURL) {
				// Z.debug(pdfURL)
				item.attachments.push({
					url: pdfURL,
					title: "Full Text PDF",
					mimeType: "application/pdf"
				});
			}
			else {
				item.attachments.push({
					title: "Snapshot",
					document: doc
				});
			}

			// Some fields have trailing commas
			if (item.publicationTitle) {
				item.publicationTitle = item.publicationTitle.replace(/,$/, '');
			}
			if (item.abstractNote) {
				item.abstractNote = item.abstractNote.replace(/,$/, '');
			}
			if (item.ISSN) {
				item.ISSN = item.ISSN.replace(/,$/, '');
			}

			/* var abstract = ZU.xpath(doc,'//div[contains(@class, "abstract")]//div[contains(@class,"article-container")]');
			if (abstract.length > 0) {
				item.abstractNote = abstract[0].textContent.replace(/^\s*Summary/, '').trim();
			}*/
			item.complete();
		});
		translator.translate();
	});
}


/** BEGIN TEST CASES **/
var testCases = [
	{
		"type": "web",
		"url": "https://www.microbiologyresearch.org/content/journal/jmm/10.1099/00222615-15-2-189",
		"items": [
			{
				"itemType": "journalArticle",
				"title": "The Microbial Ecology of the Large Bowel of Breastfed and Formula-fed Infants During the First Year of Life",
				"creators": [
					{
						"lastName": "Stark",
						"firstName": "P. L.",
						"creatorType": "author"
					},
					{
						"lastName": "Lee",
						"firstName": "A.",
						"creatorType": "author"
					}
				],
				"date": "1982",
				"DOI": "10.1099/00222615-15-2-189",
				"ISSN": "1473-5644",
				"abstractNote": "SUMMARY The succession of bacterial populations in the large bowel of seven breast-fed and seven formula-fed infants was examined during the first year of life. The composition of the intestinal microflora varied according to the infant’s diet. During the first week of life breast-fed and formula-fed infants were colonised by enterobacteria and enterococci followed by bifidobacteria, Bacteroides spp., clostridia and anaerobic streptococci. From week 4 until solid foods were given, breast-fed babies had a simple flora consisting of bifidobacteria and relatively few enterobacteria and enterococci. Formula-fed babies during the corresponding period were more often colonised by other anaerobes in addition to bifidobacteria and had higher counts of facultatively anaerobic bacteria. The introduction of solid food to the breast-fed infants caused a major disturbance in the microbial ecology of the large bowel as counts of enterobacteria and enterococci rose sharply and colonisation by Bacteroides spp., clostridia and anaerobic streptococci occurred. This was not observed when formula-fed infants began to take solids; instead, counts of facultative anaerobes remained high while colonisation by anaerobes other than bifidobacteria continued. At 12 months, the anaerobic bacterial populations of the large bowel of breast-fed and formula-fed infants were beginning to resemble those of adults in number and composition and there was a corresponding decrease in the number of facultative anaerobes. These changes are discussed in relation to changes in susceptibility to gastro-intestinal infection.",
				"issue": "2",
				"libraryCatalog": "Microbiology Society Journals",
				"pages": "189-203",
				"publicationTitle": "Journal of Medical Microbiology",
				"url": "https://www.microbiologyresearch.org/content/journal/jmm/10.1099/00222615-15-2-189",
				"volume": "15",
				"attachments": [
					{
						"title": "Full Text PDF",
						"mimeType": "application/pdf"
					}
				],
				"tags": [],
				"notes": [],
				"seeAlso": []
			}
		]
	},
	{
		"type": "web",
		"url": "https://www.microbiologyresearch.org/content/journal/ijsem/10.1099/ijsem.0.000872",
		"items": [
			{
				"itemType": "journalArticle",
				"title": "Reclassification of Achromobacter spiritinus Vandamme et al. 2013 as a later heterotypic synonym of Achromobacter marplatensis Gomila et al. 2011",
				"creators": [
					{
						"lastName": "Vandamme",
						"firstName": "Peter A.",
						"creatorType": "author"
					},
					{
						"lastName": "Peeters",
						"firstName": "Charlotte",
						"creatorType": "author"
					},
					{
						"lastName": "Cnockaert",
						"firstName": "Margo",
						"creatorType": "author"
					},
					{
						"lastName": "Gomila",
						"firstName": "Margarita",
						"creatorType": "author"
					},
					{
						"lastName": "Moore",
						"firstName": "Edward R. B.",
						"creatorType": "author"
					},
					{
						"lastName": "Spilker",
						"firstName": "Theodore",
						"creatorType": "author"
					},
					{
						"lastName": "LiPuma",
						"firstName": "John J.",
						"creatorType": "author"
					}
				],
				"date": "2016",
				"DOI": "10.1099/ijsem.0.000872",
				"ISSN": "1466-5034",
				"abstractNote": "A repeat multi-locus sequence analysis (MLSA) of concatenated nusA, eno, rpoB, gltB, lepA, nuoL and nrdA sequences of strains classified as Achromobacter marplatensis was performed. The results revealed that earlier reported sequence data of the proposed type strain were erroneous, and that the corrected concatenated sequence divergence between the A. marplatensis LMG 26219T ( = CCUG 56371T) sequence type and that of strains of Achromobacter spiritinus was well below the 2.1 % threshold value that delineates species of the genus Achromobacter. These results therefore demonstrated that strains which were classified as A. spiritinus should be reclassified as A. marplatensis and that the name Achromobacter spiritinus should no longer be used. An emendation of the description of Achromobacter marplatensis is warranted.",
				"issue": "4",
				"libraryCatalog": "Microbiology Society Journals",
				"pages": "1641-1644",
				"publicationTitle": "International Journal of Systematic and Evolutionary Microbiology",
				"url": "https://www.microbiologyresearch.org/content/journal/ijsem/10.1099/ijsem.0.000872",
				"volume": "66",
				"attachments": [
					{
						"title": "Full Text PDF",
						"mimeType": "application/pdf"
					}
				],
				"tags": [],
				"notes": [],
				"seeAlso": []
			}
		]
	},
	{
		"type": "web",
		"url": "http://mic.microbiologyresearch.org/search?value1=h2o&option1=all&option2=pub_serialIdent&value2=&operator2=AND",
		"items": "multiple"
	},
	{
		"type": "web",
		"url": "https://www.microbiologyresearch.org/content/journal/ijsem/10.1099/ijsem.0.004683?crawler=true",
		"items": [
			{
				"itemType": "journalArticle",
				"title": "Desulfovibrio subterraneus sp. nov., a mesophilic sulfate-reducing deltaproteobacterium isolated from a deep siliceous mudstone formation",
				"creators": [
					{
						"lastName": "Ueno",
						"firstName": "Akio",
						"creatorType": "author"
					},
					{
						"lastName": "Tamazawa",
						"firstName": "Satoshi",
						"creatorType": "author"
					},
					{
						"lastName": "Tamamura",
						"firstName": "Shuji",
						"creatorType": "author"
					},
					{
						"lastName": "Murakami",
						"firstName": "Takuma",
						"creatorType": "author"
					},
					{
						"lastName": "Kiyama",
						"firstName": "Tamotsu",
						"creatorType": "author"
					},
					{
						"lastName": "Inomata",
						"firstName": "Hidenori",
						"creatorType": "author"
					},
					{
						"lastName": "Amano",
						"firstName": "Yuki",
						"creatorType": "author"
					},
					{
						"lastName": "Miyakawa",
						"firstName": "Kazuya",
						"creatorType": "author"
					},
					{
						"lastName": "Tamaki",
						"firstName": "Hideyuki",
						"creatorType": "author"
					},
					{
						"lastName": "Naganuma",
						"firstName": "Takeshi",
						"creatorType": "author"
					},
					{
						"lastName": "Kaneko",
						"firstName": "Katsuhiko",
						"creatorType": "author"
					}
				],
				"date": "2021",
				"DOI": "10.1099/ijsem.0.004683",
				"ISSN": "1466-5034",
				"abstractNote": "A novel mesophilic sulfate-reducing bacterium, strain HN2T, was isolated from groundwater sampled from the subsurface siliceous mudstone of the Wakkanai Formation located in Horonobe, Hokkaido, Japan. The bacterium was Gram-negative and vibrio-shaped, and its motility was conferred by a single polar flagellum. Cells had desulfoviridin. Catalase and oxidase activities were not detected. It grew in the temperature range of 25–40 °C (optimum, 35 °C) and pH range of 6.3–8.1 (optimum, pH 7.2–7.6). It used sulfate, thiosulfate, dimethyl sulfoxide, anthraquinone-2,6-disulfonate, Fe3+, and manganese oxide, but not elemental sulfur, nitrite, nitrate, or fumarate as electron acceptors. The strain showed weak growth with sulfite as the electron acceptor. Fermentative growth with pyruvate, lactate and cysteine was observed in the absence of sulfate, but not with malate or fumarate. NaCl was not required, but the strain tolerated up to 40 g l–1. Strain HN2T did not require vitamins. The major cellular fatty acids were iso-C15 : 0 (23.8 %), C18 : 1  ω9t (18.4 %), C18 : 0 (15.0 %), C16 : 0 (14.5 %), and anteiso-C17 :0 (10.1 %). The major respiratory quinone was menaquinone MK-6(H2). The G+C content of the genomic DNA was 56.7 mol%. Based on 16S rRNA gene sequence analysis, the closest phylogenetic relative of strain HN2T is Desulfovibrio psychrotolerans JS1T (97.0 %). Digital DNA–DNA hybridization (dDDH) and average nucleotide identity (ANI) values of the strains HN2T and D. psychrotolerans JS1T were 22.2 and 79.8 %, respectively. Based on the phenotypic and molecular genetic evidence, we propose a novel species, D. subterraneus sp. nov. with the type strain HN2T (=DSM 101010T=NBRC 112213T).",
				"issue": "2",
				"libraryCatalog": "Microbiology Society Journals",
				"pages": "004683",
				"publicationTitle": "International Journal of Systematic and Evolutionary Microbiology",
				"url": "https://www.microbiologyresearch.org/content/journal/ijsem/10.1099/ijsem.0.004683",
				"volume": "71",
				"attachments": [
					{
						"title": "Snapshot",
						"mimeType": "text/html"
					}
				],
				"tags": [],
				"notes": [],
				"seeAlso": []
			}
		]
	}
]
/** END TEST CASES **/
