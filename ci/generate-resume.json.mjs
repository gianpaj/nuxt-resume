#!/usr/bin/env node

import { resumeData as data } from '../resume-data.mjs';
import request from 'request-promise';
import _ from 'lodash';
import md5 from 'md5';
import yargs from 'yargs';

(async () => {
  const { githubPat, gitlabPat } = yargs
    .usage(
      'Usage: generate-resume.json.mjs --github-pat <pat> --gitlab-pat <pat>',
    )
    .alias('h', 'github-pat')
    .describe(
      'github-pat',
      'A GitHub PAT with "gist" scope. If not provided, the Gist will not be updated.',
    )
    .alias('l', 'gitlab-pat')
    .describe(
      'gitlab-pat',
      'A GitLab PAT with "api" scope. If not provided, the Snippet will not be updated.',
    ).argv;

  const email = data.contactInfo.find(ci => ci.type === 'email').display;
  const website = data.contactInfo.find(ci => ci.type === 'website').link;
  const locationData = data.contactInfo.find(ci => ci.type === 'location');

  const resumeJson = {
    // Strangely, including the $schema property
    // causes jsonresume.org to throw errors
    // $schema: 'http://json.schemastore.org/resume',
    basics: {
      name: _.isString(data.title)
        ? data.title
        : data.title.map(c => (_.isString(c) ? c : c.character)).join(''),
      label: data.label,
      picture: `https://secure.gravatar.com/avatar/${md5(
        email,
      )}?s=800&d=robohash`,
      email,
      website,
      location: {
        city: locationData.city,
        countryCode: locationData.countryCode,
        region: locationData.region,
      },
    },
  };

  const stringifiedResumeJson = JSON.stringify(resumeJson, null, 2);

  console.log('Transformed resume data into the following resume.json format:');
  console.log(stringifiedResumeJson);

  if (githubPat) {
    const gistId = '36d83b1526df75a663d9c3ad0b1cd630';
    console.log(
      `Updating the GitHub resume.json Gist (https://gist.github.com/nfriend/${gistId})...`,
    );
    await request.patch(
      `https://nfriend:${githubPat}@api.github.com/gists/${gistId}`,
      {
        json: true,
        body: {
          description:
            'My resume.json: https://jsonresume.org/. This file is automatically generated by the CI pipeline of my Nuxt Résumé project: https://gitlab.com/nfriend/nuxt-resume#resumejson',
          files: {
            'resume.json': {
              content: stringifiedResumeJson,
            },
          },
        },
        headers: {
          'User-Agent': 'nfriend',
        },
      },
    );
  } else {
    console.log(
      'No GitHub PAT was provided, so skipping the Gist update.',
      'You can provide a GitHub PAT using the --github-pat option.',
    );
  }

  if (gitlabPat) {
    const snippetId = 1948091;
    console.log(
      `Updating the GitLab resume.json Snippet (https://gitlab.com/snippets/${1948091})...`,
    );
    await request.put(`https://gitlab.com/api/v4/snippets/${snippetId}`, {
      json: true,
      body: {
        id: snippetId,
        title: 'resume.json',
        file_name: 'resume.json',
        description:
          'My [resume.json](https://jsonresume.org/). This file is automatically generated by the CI pipeline of my [Nuxt Résumé project](https://gitlab.com/nfriend/nuxt-resume#resumejson).',
        content: stringifiedResumeJson,
        visibility: 'public',
      },
      headers: {
        'PRIVATE-TOKEN': gitlabPat,
      },
    });
  } else {
    console.log(
      'No GitLab PAT was provided, so skipping the Snippet update.',
      'You can provide a GitLab PAT using the --gitlab-pat option.',
    );
  }
})();
